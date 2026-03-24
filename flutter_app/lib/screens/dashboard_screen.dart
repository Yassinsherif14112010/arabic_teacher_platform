import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';
import '../widgets/stat_card.dart';
import '../widgets/gradient_background.dart';
import '../services/sync_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DataProvider>().loadAllData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;
    final crossAxisCount = isTablet ? 3 : 2;

    final totalStudents = data.students.length;
    final activeStudents = data.students.where((s) => s.status == 'active').length;
    final presentToday = data.todayAttendance.where((a) => a.status == 'present').length;
    final totalGroups = data.groups.length;
    final totalPayments = data.payments.length;
    final paidStudents = data.students.where((s) => s.feePaid).length;

    return GradientBackground(
      child: data.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => data.loadAllData(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.all(isTablet ? 24 : 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sync status bar
                    _buildSyncStatusBar(data),
                    const SizedBox(height: 16),

                    // Stats grid
                    GridView.count(
                      crossAxisCount: crossAxisCount,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: isTablet ? 1.6 : 1.3,
                      children: [
                        StatCard(
                          title: 'إجمالي الطلاب',
                          value: '$totalStudents',
                          icon: Icons.people,
                          gradientColors: [const Color(0xFF3949ab), const Color(0xFF1a237e)],
                        ),
                        StatCard(
                          title: 'الطلاب النشطين',
                          value: '$activeStudents',
                          icon: Icons.person_outline,
                          gradientColors: [const Color(0xFF00897b), const Color(0xFF004d40)],
                        ),
                        StatCard(
                          title: 'الحضور اليوم',
                          value: '$presentToday',
                          icon: Icons.check_circle_outline,
                          gradientColors: [const Color(0xFF43a047), const Color(0xFF1b5e20)],
                        ),
                        StatCard(
                          title: 'المجموعات',
                          value: '$totalGroups',
                          icon: Icons.group_work,
                          gradientColors: [const Color(0xFFe65100), const Color(0xFFbf360c)],
                        ),
                        StatCard(
                          title: 'المدفوعات',
                          value: '$totalPayments',
                          icon: Icons.payments,
                          gradientColors: [const Color(0xFF6a1b9a), const Color(0xFF4a148c)],
                        ),
                        StatCard(
                          title: 'الطلاب المسددين',
                          value: '$paidStudents',
                          icon: Icons.paid,
                          gradientColors: [const Color(0xFF00838f), const Color(0xFF006064)],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Recent attendance
                    if (data.todayAttendance.isNotEmpty) ...[
                      Text(
                        'حضور اليوم',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      Card(
                        color: Theme.of(context).cardColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: data.todayAttendance.length > 10
                              ? 10
                              : data.todayAttendance.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final record = data.todayAttendance[index];
                            final student = data.students
                                .where((s) => s.id == record.studentId)
                                .firstOrNull;
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: record.status == 'present'
                                    ? Colors.green
                                    : record.status == 'late'
                                        ? Colors.orange
                                        : Colors.red,
                                child: Icon(
                                  record.status == 'present'
                                      ? Icons.check
                                      : record.status == 'late'
                                          ? Icons.access_time
                                          : Icons.close,
                                  color: Colors.white,
                                ),
                              ),
                              title: Text(
                                student?.name ?? 'طالب #${record.studentId}',
                                textDirection: TextDirection.rtl,
                              ),
                              subtitle: Text(
                                record.status == 'present'
                                    ? 'حاضر'
                                    : record.status == 'late'
                                        ? 'متأخر'
                                        : 'غائب',
                                textDirection: TextDirection.rtl,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSyncStatusBar(DataProvider data) {
    IconData icon;
    String text;
    Color color;

    switch (data.syncStatus) {
      case SyncStatus.synced:
        icon = Icons.cloud_done;
        text = 'متزامن';
        color = Colors.green;
        break;
      case SyncStatus.syncing:
        icon = Icons.sync;
        text = 'جاري المزامنة...';
        color = Colors.blue;
        break;
      case SyncStatus.offline:
        icon = Icons.cloud_off;
        text = 'غير متصل - وضع أوفلاين';
        color = Colors.orange;
        break;
      case SyncStatus.error:
        icon = Icons.error_outline;
        text = 'خطأ في المزامنة';
        color = Colors.red;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
            textDirection: TextDirection.rtl,
          ),
          const Spacer(),
          if (data.syncStatus != SyncStatus.syncing)
            TextButton.icon(
              onPressed: () => data.syncData(),
              icon: Icon(Icons.refresh, color: color, size: 18),
              label: Text('مزامنة', style: TextStyle(color: color)),
            ),
        ],
      ),
    );
  }
}

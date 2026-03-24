import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/attendance.dart';
import '../providers/data_provider.dart';
import '../widgets/gradient_background.dart';
import '../widgets/glass_container.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  String _barcodeInput = '';
  final _barcodeController = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _barcodeController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;

    return GradientBackground(
      child: Column(
        children: [
          // Barcode scanner input
          Padding(
            padding: EdgeInsets.all(isTablet ? 24 : 16),
            child: GlassContainer(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text(
                    'تسجيل الحضور',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _barcodeController,
                          focusNode: _focusNode,
                          decoration: InputDecoration(
                            hintText: 'امسح الباركود أو أدخل الرقم...',
                            prefixIcon: const Icon(Icons.qr_code_scanner),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onChanged: (v) => _barcodeInput = v,
                          onSubmitted: (_) => _markAttendance(data, 'present'),
                          autofocus: true,
                        ),
                      ),
                      const SizedBox(width: 12),
                      _buildAttendanceButton(
                        'حاضر',
                        Icons.check_circle,
                        Colors.green,
                        () => _markAttendance(data, 'present'),
                      ),
                      const SizedBox(width: 8),
                      _buildAttendanceButton(
                        'متأخر',
                        Icons.access_time,
                        Colors.orange,
                        () => _markAttendance(data, 'late'),
                      ),
                      const SizedBox(width: 8),
                      _buildAttendanceButton(
                        'غائب',
                        Icons.cancel,
                        Colors.red,
                        () => _markAttendance(data, 'absent'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Today's attendance list
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isTablet ? 24 : 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'حضور اليوم (${data.todayAttendance.length})',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  textDirection: TextDirection.rtl,
                ),
                TextButton.icon(
                  onPressed: () => data.refreshAttendance(),
                  icon: const Icon(Icons.refresh),
                  label: const Text('تحديث'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: data.todayAttendance.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.event_available,
                            size: 64, color: Colors.grey.withOpacity(0.5)),
                        const SizedBox(height: 16),
                        Text(
                          'لا يوجد حضور مسجل اليوم',
                          style: TextStyle(
                              color: Colors.grey.withOpacity(0.7), fontSize: 18),
                          textDirection: TextDirection.rtl,
                        ),
                      ],
                    ),
                  )
                : isTablet
                    ? _buildTableView(data)
                    : _buildListView(data),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceButton(
      String label, IconData icon, Color color, VoidCallback onPressed) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Widget _buildTableView(DataProvider data) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassContainer(
        padding: EdgeInsets.zero,
        child: DataTable(
          columns: const [
            DataColumn(label: Text('الطالب', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('الحالة', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('التاريخ', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('ملاحظات', textDirection: TextDirection.rtl)),
          ],
          rows: data.todayAttendance.map((record) {
            final student = data.students
                .where((s) => s.id == record.studentId)
                .firstOrNull;
            return DataRow(cells: [
              DataCell(Text(
                student?.name ?? 'طالب #${record.studentId}',
                textDirection: TextDirection.rtl,
              )),
              DataCell(_buildStatusChip(record.status)),
              DataCell(Text(record.attendanceDate)),
              DataCell(Text(record.notes ?? '-', textDirection: TextDirection.rtl)),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildListView(DataProvider data) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: data.todayAttendance.length,
      itemBuilder: (context, index) {
        final record = data.todayAttendance[index];
        final student = data.students
            .where((s) => s.id == record.studentId)
            .firstOrNull;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color: Theme.of(context).cardColor,
          child: ListTile(
            leading: _buildStatusIcon(record.status),
            title: Text(
              student?.name ?? 'طالب #${record.studentId}',
              textDirection: TextDirection.rtl,
            ),
            subtitle: Text(record.attendanceDate),
            trailing: _buildStatusChip(record.status),
          ),
        );
      },
    );
  }

  Widget _buildStatusIcon(String status) {
    switch (status) {
      case 'present':
        return const CircleAvatar(
          backgroundColor: Colors.green,
          child: Icon(Icons.check, color: Colors.white),
        );
      case 'late':
        return const CircleAvatar(
          backgroundColor: Colors.orange,
          child: Icon(Icons.access_time, color: Colors.white),
        );
      default:
        return const CircleAvatar(
          backgroundColor: Colors.red,
          child: Icon(Icons.close, color: Colors.white),
        );
    }
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;
    switch (status) {
      case 'present':
        color = Colors.green;
        label = 'حاضر';
        break;
      case 'late':
        color = Colors.orange;
        label = 'متأخر';
        break;
      default:
        color = Colors.red;
        label = 'غائب';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  void _markAttendance(DataProvider data, String status) {
    if (_barcodeInput.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('أدخل رقم الباركود أولاً', textDirection: TextDirection.rtl),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final student = data.students
        .where((s) => s.barcodeNumber == _barcodeInput.trim())
        .firstOrNull;

    if (student == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('لم يتم العثور على الطالب', textDirection: TextDirection.rtl),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final today = DateTime.now().toIso8601String().split('T')[0];
    final record = AttendanceRecord(
      studentId: student.id!,
      attendanceDate: today,
      status: status,
    );

    data.markAttendance(record);
    _barcodeController.clear();
    _barcodeInput = '';
    _focusNode.requestFocus();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'تم تسجيل ${student.name} - ${status == 'present' ? 'حاضر' : status == 'late' ? 'متأخر' : 'غائب'}',
          textDirection: TextDirection.rtl,
        ),
        backgroundColor: status == 'present'
            ? Colors.green
            : status == 'late'
                ? Colors.orange
                : Colors.red,
      ),
    );
  }
}

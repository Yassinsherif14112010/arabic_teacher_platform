import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../services/sync_service.dart';
import 'dashboard_screen.dart';
import 'students_screen.dart';
import 'attendance_screen.dart';
import 'payments_screen.dart';
import 'grades_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<_NavItem> _navItems = const [
    _NavItem(title: 'لوحة التحكم', icon: Icons.dashboard),
    _NavItem(title: 'الطلاب', icon: Icons.people),
    _NavItem(title: 'الحضور', icon: Icons.event_available),
    _NavItem(title: 'المدفوعات والرسوم', icon: Icons.payment),
    _NavItem(title: 'الدرجات', icon: Icons.school),
  ];

  final List<Widget> _screens = const [
    DashboardScreen(),
    StudentsScreen(),
    AttendanceScreen(),
    PaymentsScreen(),
    GradesScreen(),
  ];

  @override
  void initState() {
    super.initState();
    SyncService.startPeriodicSync();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DataProvider>().loadAllData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          title: Text(
            _navItems[_selectedIndex].title,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          leading: isTablet
              ? null
              : IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                ),
          actions: [
            // Sync button
            IconButton(
              icon: const Icon(Icons.sync),
              onPressed: () => context.read<DataProvider>().syncData(),
              tooltip: 'مزامنة',
            ),
            // Theme toggle
            IconButton(
              icon: Icon(
                themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode,
              ),
              onPressed: () => themeProvider.toggleTheme(),
              tooltip: themeProvider.isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن',
            ),
          ],
        ),
        drawer: isTablet ? null : _buildDrawer(auth, themeProvider),
        body: Row(
          children: [
            // Tablet sidebar
            if (isTablet)
              NavigationRail(
                selectedIndex: _selectedIndex,
                onDestinationSelected: (index) {
                  setState(() => _selectedIndex = index);
                },
                labelType: NavigationRailLabelType.all,
                leading: Column(
                  children: [
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF3949ab), Color(0xFF1a237e)],
                        ),
                      ),
                      child: const Icon(Icons.school, color: Colors.white, size: 28),
                    ),
                    const SizedBox(height: 4),
                    if (auth.user != null)
                      Text(
                        auth.user!.name ?? auth.user!.username,
                        style: const TextStyle(fontSize: 11),
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 16),
                  ],
                ),
                trailing: Expanded(
                  child: Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: IconButton(
                        icon: const Icon(Icons.logout, color: Colors.red),
                        onPressed: () => _logout(auth),
                        tooltip: 'تسجيل الخروج',
                      ),
                    ),
                  ),
                ),
                destinations: _navItems.map((item) {
                  return NavigationRailDestination(
                    icon: Icon(item.icon),
                    label: Text(item.title),
                  );
                }).toList(),
              ),
            // Main content
            Expanded(
              child: _screens[_selectedIndex],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer(AuthProvider auth, ThemeProvider themeProvider) {
    return Drawer(
      child: Column(
        children: [
          // Drawer header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 50, 16, 20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF3949ab), Color(0xFF1a237e)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.2),
                  ),
                  child: const Icon(Icons.school, color: Colors.white, size: 36),
                ),
                const SizedBox(height: 12),
                const Text(
                  'منصة إدارة الطلاب',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text(
                  'محسن شاكر',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                if (auth.user != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    auth.user!.name ?? auth.user!.username,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ],
            ),
          ),

          // Navigation items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                for (int i = 0; i < _navItems.length; i++)
                  ListTile(
                    leading: Icon(
                      _navItems[i].icon,
                      color: _selectedIndex == i
                          ? const Color(0xFF3949ab)
                          : null,
                    ),
                    title: Text(
                      _navItems[i].title,
                      style: TextStyle(
                        fontWeight: _selectedIndex == i
                            ? FontWeight.bold
                            : FontWeight.normal,
                        color: _selectedIndex == i
                            ? const Color(0xFF3949ab)
                            : null,
                      ),
                    ),
                    selected: _selectedIndex == i,
                    onTap: () {
                      setState(() => _selectedIndex = i);
                      Navigator.pop(context);
                    },
                  ),
                const Divider(),
                // Theme toggle
                SwitchListTile(
                  title: const Text('الوضع الداكن'),
                  secondary: Icon(
                    themeProvider.isDarkMode
                        ? Icons.dark_mode
                        : Icons.light_mode,
                  ),
                  value: themeProvider.isDarkMode,
                  onChanged: (_) => themeProvider.toggleTheme(),
                ),
              ],
            ),
          ),

          // Logout button
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text(
              'تسجيل الخروج',
              style: TextStyle(color: Colors.red),
            ),
            onTap: () => _logout(auth),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _logout(AuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تسجيل الخروج', textDirection: TextDirection.rtl),
        content: const Text('هل أنت متأكد من تسجيل الخروج؟', textDirection: TextDirection.rtl),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              auth.logout();
              Navigator.pop(ctx);
              Navigator.of(context).pushReplacementNamed('/login');
            },
            child: const Text('خروج'),
          ),
        ],
      ),
    );
  }
}

class _NavItem {
  final String title;
  final IconData icon;

  const _NavItem({required this.title, required this.icon});
}

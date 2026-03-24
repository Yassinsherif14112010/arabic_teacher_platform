import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'database_service.dart';

class SyncService {
  static Timer? _syncTimer;
  static bool _isSyncing = false;
  static final StreamController<SyncStatus> _statusController =
      StreamController<SyncStatus>.broadcast();

  static Stream<SyncStatus> get statusStream => _statusController.stream;

  static void startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (_) => sync());
  }

  static void stopPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  static Future<bool> isOnline() async {
    final result = await Connectivity().checkConnectivity();
    return result != ConnectivityResult.none;
  }

  static Future<SyncResult> sync() async {
    if (_isSyncing) return SyncResult(success: false, message: 'المزامنة جارية بالفعل');

    _isSyncing = true;
    _statusController.add(SyncStatus.syncing);

    try {
      final online = await isOnline();
      if (!online) {
        _isSyncing = false;
        _statusController.add(SyncStatus.offline);
        return SyncResult(success: false, message: 'لا يوجد اتصال بالإنترنت');
      }

      // 1. Push local unsynced data to server
      await _pushUnsyncedData();

      // 2. Pull latest data from server
      await _pullServerData();

      _isSyncing = false;
      _statusController.add(SyncStatus.synced);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('last_sync', DateTime.now().toIso8601String());

      return SyncResult(success: true, message: 'تمت المزامنة بنجاح');
    } catch (e) {
      _isSyncing = false;
      _statusController.add(SyncStatus.error);
      return SyncResult(success: false, message: 'فشل في المزامنة: $e');
    }
  }

  static Future<void> _pushUnsyncedData() async {
    // Push unsynced students
    final unsyncedStudents = await DatabaseService.getUnsyncedStudents();
    for (final student in unsyncedStudents) {
      try {
        final data = Map<String, dynamic>.from(student);
        data.remove('synced');
        data.remove('localId');
        final localId = student['id'] as int;
        data.remove('id');

        final result = await ApiService.createStudent(data);
        if (result['id'] != null) {
          await DatabaseService.updateStudent(localId, {'synced': 1});
        }
      } catch (_) {
        // Will retry next sync
      }
    }

    // Push unsynced attendance
    final unsyncedAttendance = await DatabaseService.getUnsyncedAttendance();
    for (final record in unsyncedAttendance) {
      try {
        final data = Map<String, dynamic>.from(record);
        data.remove('synced');
        data.remove('localId');
        data.remove('id');
        await ApiService.markAttendance(data);
      } catch (_) {
        // Will retry next sync
      }
    }

    // Push unsynced grades
    final unsyncedGrades = await DatabaseService.getUnsyncedGrades();
    for (final grade in unsyncedGrades) {
      try {
        final data = Map<String, dynamic>.from(grade);
        data.remove('synced');
        data.remove('localId');
        data.remove('id');
        await ApiService.addGrade(data);
      } catch (_) {
        // Will retry next sync
      }
    }

    // Push unsynced payments
    final unsyncedPayments = await DatabaseService.getUnsyncedPayments();
    for (final payment in unsyncedPayments) {
      try {
        final data = Map<String, dynamic>.from(payment);
        data.remove('synced');
        data.remove('localId');
        data.remove('id');
        await ApiService.addPayment(data);
      } catch (_) {
        // Will retry next sync
      }
    }
  }

  static Future<void> _pullServerData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastSync = prefs.getString('last_sync');

      final syncData = await ApiService.syncData(lastSyncTimestamp: lastSync);

      if (syncData['students'] != null) {
        await DatabaseService.replaceStudents(
          (syncData['students'] as List).cast<Map<String, dynamic>>(),
        );
      }
      if (syncData['attendance'] != null) {
        await DatabaseService.replaceAttendance(
          (syncData['attendance'] as List).cast<Map<String, dynamic>>(),
        );
      }
      if (syncData['groups'] != null) {
        await DatabaseService.replaceGroups(
          (syncData['groups'] as List).cast<Map<String, dynamic>>(),
        );
      }
      if (syncData['fees'] != null) {
        await DatabaseService.replaceFees(
          (syncData['fees'] as List).cast<Map<String, dynamic>>(),
        );
      }
      if (syncData['payments'] != null) {
        await DatabaseService.replacePayments(
          (syncData['payments'] as List).cast<Map<String, dynamic>>(),
        );
      }
    } catch (_) {
      // Pull failed, will retry next sync
    }
  }

  static Future<String?> getLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('last_sync');
  }
}

enum SyncStatus { synced, syncing, offline, error }

class SyncResult {
  final bool success;
  final String message;

  SyncResult({required this.success, required this.message});
}

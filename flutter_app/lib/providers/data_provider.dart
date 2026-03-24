import 'package:flutter/material.dart';
import '../models/student.dart';
import '../models/attendance.dart';
import '../models/grade.dart';
import '../models/payment.dart';
import '../models/study_group.dart';
import '../models/fee_setting.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';
import '../services/sync_service.dart';

class DataProvider extends ChangeNotifier {
  List<Student> _students = [];
  List<AttendanceRecord> _todayAttendance = [];
  List<Payment> _payments = [];
  List<StudyGroup> _groups = [];
  List<FeeSetting> _fees = [];
  bool _isLoading = false;
  String? _error;
  SyncStatus _syncStatus = SyncStatus.offline;

  List<Student> get students => _students;
  List<AttendanceRecord> get todayAttendance => _todayAttendance;
  List<Payment> get payments => _payments;
  List<StudyGroup> get groups => _groups;
  List<FeeSetting> get fees => _fees;
  bool get isLoading => _isLoading;
  String? get error => _error;
  SyncStatus get syncStatus => _syncStatus;

  DataProvider() {
    SyncService.statusStream.listen((status) {
      _syncStatus = status;
      notifyListeners();
    });
  }

  Future<void> loadAllData() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Try online first
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await _loadFromServer();
      } else {
        await _loadFromLocal();
      }
    } catch (_) {
      await _loadFromLocal();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _loadFromServer() async {
    try {
      final results = await Future.wait([
        ApiService.getStudents(),
        ApiService.getTodayAttendance(),
        ApiService.getAllPayments(),
        ApiService.getGroups(),
        ApiService.getFees(),
      ]);

      _students = (results[0])
          .map((e) => Student.fromJson(e as Map<String, dynamic>))
          .toList();
      _todayAttendance = (results[1])
          .map((e) => AttendanceRecord.fromJson(e as Map<String, dynamic>))
          .toList();
      _payments = (results[2])
          .map((e) => Payment.fromJson(e as Map<String, dynamic>))
          .toList();
      _groups = (results[3])
          .map((e) => StudyGroup.fromJson(e as Map<String, dynamic>))
          .toList();
      _fees = (results[4])
          .map((e) => FeeSetting.fromJson(e as Map<String, dynamic>))
          .toList();

      // Save to local DB
      await DatabaseService.replaceStudents(
        _students.map((s) => s.toDbMap()).toList(),
      );
      await DatabaseService.replaceGroups(
        _groups.map((g) => g.toDbMap()).toList(),
      );
      await DatabaseService.replaceFees(
        _fees.map((f) => f.toDbMap()).toList(),
      );
    } catch (_) {
      await _loadFromLocal();
    }
  }

  Future<void> _loadFromLocal() async {
    final studentsData = await DatabaseService.getStudents();
    _students = studentsData.map((e) => Student.fromJson(e)).toList();

    final today = DateTime.now().toIso8601String().split('T')[0];
    final attendanceData = await DatabaseService.getAttendance(date: today);
    _todayAttendance = attendanceData.map((e) => AttendanceRecord.fromJson(e)).toList();

    final paymentsData = await DatabaseService.getPayments();
    _payments = paymentsData.map((e) => Payment.fromJson(e)).toList();

    final groupsData = await DatabaseService.getGroups();
    _groups = groupsData.map((e) => StudyGroup.fromJson(e)).toList();

    final feesData = await DatabaseService.getFees();
    _fees = feesData.map((e) => FeeSetting.fromJson(e)).toList();
  }

  // Students
  Future<void> addStudent(Student student) async {
    _isLoading = true;
    notifyListeners();

    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        final result = await ApiService.createStudent(student.toJson());
        final newStudent = Student.fromJson(result);
        _students.add(newStudent);
        await DatabaseService.insertStudent(newStudent.toDbMap());
      } else {
        final localStudent = student.copyWith(synced: false);
        final id = await DatabaseService.insertStudent(localStudent.toDbMap());
        _students.add(localStudent.copyWith(id: id));
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateStudent(int id, Student student) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.updateStudent(id, student.toJson());
      }
      await DatabaseService.updateStudent(id, student.toDbMap());

      final index = _students.indexWhere((s) => s.id == id);
      if (index != -1) {
        _students[index] = student.copyWith(id: id);
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteStudent(int id) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.deleteStudent(id);
      }
      await DatabaseService.deleteStudent(id);
      _students.removeWhere((s) => s.id == id);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Attendance
  Future<void> markAttendance(AttendanceRecord record) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.markAttendance(record.toJson());
      }
      await DatabaseService.insertAttendance(
        online ? record.toDbMap() : {...record.toDbMap(), 'synced': 0},
      );
      _todayAttendance.add(record);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> refreshAttendance() async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        final data = await ApiService.getTodayAttendance();
        _todayAttendance = data
            .map((e) => AttendanceRecord.fromJson(e as Map<String, dynamic>))
            .toList();
      } else {
        final today = DateTime.now().toIso8601String().split('T')[0];
        final data = await DatabaseService.getAttendance(date: today);
        _todayAttendance = data.map((e) => AttendanceRecord.fromJson(e)).toList();
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Grades
  Future<List<GradeRecord>> getStudentGrades(int studentId) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        final data = await ApiService.getStudentGrades(studentId);
        return data
            .map((e) => GradeRecord.fromJson(e as Map<String, dynamic>))
            .toList();
      } else {
        final data = await DatabaseService.getGrades(studentId: studentId);
        return data.map((e) => GradeRecord.fromJson(e)).toList();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return [];
    }
  }

  Future<void> addGrade(GradeRecord grade) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.addGrade(grade.toJson());
      }
      await DatabaseService.insertGrade(
        online ? grade.toDbMap() : {...grade.toDbMap(), 'synced': 0},
      );
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Payments
  Future<void> addPayment(Payment payment) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.addPayment(payment.toJson());
      }
      await DatabaseService.insertPayment(
        online ? payment.toDbMap() : {...payment.toDbMap(), 'synced': 0},
      );
      _payments.add(payment);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<List<Payment>> getStudentPayments(int studentId) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        final data = await ApiService.getStudentPayments(studentId);
        return data
            .map((e) => Payment.fromJson(e as Map<String, dynamic>))
            .toList();
      } else {
        final data = await DatabaseService.getPayments(studentId: studentId);
        return data.map((e) => Payment.fromJson(e)).toList();
      }
    } catch (e) {
      return [];
    }
  }

  // Groups
  Future<void> addGroup(StudyGroup group) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        final result = await ApiService.createGroup(group.toJson());
        final newGroup = StudyGroup.fromJson(result);
        _groups.add(newGroup);
        await DatabaseService.insertGroup(newGroup.toDbMap());
      } else {
        final id = await DatabaseService.insertGroup(group.toDbMap());
        _groups.add(StudyGroup(
          id: id,
          name: group.name,
          grade: group.grade,
          description: group.description,
          schedule: group.schedule,
        ));
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateGroup(int id, StudyGroup group) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.updateGroup(id, group.toJson());
      }
      await DatabaseService.updateGroup(id, group.toDbMap());

      final index = _groups.indexWhere((g) => g.id == id);
      if (index != -1) {
        _groups[index] = StudyGroup(
          id: id,
          name: group.name,
          grade: group.grade,
          description: group.description,
          schedule: group.schedule,
        );
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteGroup(int id) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.deleteGroup(id);
      }
      await DatabaseService.deleteGroup(id);
      _groups.removeWhere((g) => g.id == id);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Fees
  Future<void> addFee(FeeSetting fee) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        final result = await ApiService.createFee(fee.toJson());
        final newFee = FeeSetting.fromJson(result);
        _fees.add(newFee);
        await DatabaseService.insertFee(newFee.toDbMap());
      } else {
        final id = await DatabaseService.insertFee(fee.toDbMap());
        _fees.add(FeeSetting(
          id: id,
          grade: fee.grade,
          amount: fee.amount,
          description: fee.description,
        ));
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteFee(int id) async {
    try {
      final online = await SyncService.isOnline();
      if (online && ApiService.token != null) {
        await ApiService.deleteFee(id);
      }
      await DatabaseService.deleteFee(id);
      _fees.removeWhere((f) => f.id == id);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Sync
  Future<void> syncData() async {
    final result = await SyncService.sync();
    if (result.success) {
      await loadAllData();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

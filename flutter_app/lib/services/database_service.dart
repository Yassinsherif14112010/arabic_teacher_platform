import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseService {
  static Database? _database;

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  static Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'arabic_teacher.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  static Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        parentPhone TEXT,
        barcodeNumber TEXT NOT NULL,
        grade TEXT,
        groupId INTEGER,
        feePaid INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        synced INTEGER DEFAULT 1,
        localId TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        attendanceDate TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        synced INTEGER DEFAULT 1,
        localId TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        examType TEXT NOT NULL,
        score TEXT NOT NULL,
        maxScore TEXT DEFAULT '100',
        examDate TEXT NOT NULL,
        subject TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 1,
        localId TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        amount TEXT NOT NULL,
        paymentDate TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        month TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 1,
        localId TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE groups_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        grade TEXT NOT NULL,
        description TEXT,
        schedule TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade TEXT NOT NULL,
        amount TEXT NOT NULL,
        description TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    ''');
  }

  // Students
  static Future<List<Map<String, dynamic>>> getStudents() async {
    final db = await database;
    return await db.query('students');
  }

  static Future<int> insertStudent(Map<String, dynamic> student) async {
    final db = await database;
    return await db.insert('students', student);
  }

  static Future<int> updateStudent(int id, Map<String, dynamic> student) async {
    final db = await database;
    return await db.update('students', student, where: 'id = ?', whereArgs: [id]);
  }

  static Future<int> deleteStudent(int id) async {
    final db = await database;
    return await db.delete('students', where: 'id = ?', whereArgs: [id]);
  }

  static Future<Map<String, dynamic>?> getStudentByBarcode(String barcode) async {
    final db = await database;
    final results = await db.query(
      'students',
      where: 'barcodeNumber = ?',
      whereArgs: [barcode],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  static Future<List<Map<String, dynamic>>> getUnsyncedStudents() async {
    final db = await database;
    return await db.query('students', where: 'synced = ?', whereArgs: [0]);
  }

  // Attendance
  static Future<List<Map<String, dynamic>>> getAttendance({String? date}) async {
    final db = await database;
    if (date != null) {
      return await db.query('attendance', where: 'attendanceDate = ?', whereArgs: [date]);
    }
    return await db.query('attendance');
  }

  static Future<int> insertAttendance(Map<String, dynamic> record) async {
    final db = await database;
    return await db.insert('attendance', record);
  }

  static Future<List<Map<String, dynamic>>> getUnsyncedAttendance() async {
    final db = await database;
    return await db.query('attendance', where: 'synced = ?', whereArgs: [0]);
  }

  // Grades
  static Future<List<Map<String, dynamic>>> getGrades({int? studentId}) async {
    final db = await database;
    if (studentId != null) {
      return await db.query('grades', where: 'studentId = ?', whereArgs: [studentId]);
    }
    return await db.query('grades');
  }

  static Future<int> insertGrade(Map<String, dynamic> grade) async {
    final db = await database;
    return await db.insert('grades', grade);
  }

  static Future<List<Map<String, dynamic>>> getUnsyncedGrades() async {
    final db = await database;
    return await db.query('grades', where: 'synced = ?', whereArgs: [0]);
  }

  // Payments
  static Future<List<Map<String, dynamic>>> getPayments({int? studentId}) async {
    final db = await database;
    if (studentId != null) {
      return await db.query('payments', where: 'studentId = ?', whereArgs: [studentId]);
    }
    return await db.query('payments');
  }

  static Future<int> insertPayment(Map<String, dynamic> payment) async {
    final db = await database;
    return await db.insert('payments', payment);
  }

  static Future<List<Map<String, dynamic>>> getUnsyncedPayments() async {
    final db = await database;
    return await db.query('payments', where: 'synced = ?', whereArgs: [0]);
  }

  // Groups
  static Future<List<Map<String, dynamic>>> getGroups() async {
    final db = await database;
    return await db.query('groups_table');
  }

  static Future<int> insertGroup(Map<String, dynamic> group) async {
    final db = await database;
    return await db.insert('groups_table', group);
  }

  static Future<int> updateGroup(int id, Map<String, dynamic> group) async {
    final db = await database;
    return await db.update('groups_table', group, where: 'id = ?', whereArgs: [id]);
  }

  static Future<int> deleteGroup(int id) async {
    final db = await database;
    return await db.delete('groups_table', where: 'id = ?', whereArgs: [id]);
  }

  // Fees
  static Future<List<Map<String, dynamic>>> getFees() async {
    final db = await database;
    return await db.query('fees');
  }

  static Future<int> insertFee(Map<String, dynamic> fee) async {
    final db = await database;
    return await db.insert('fees', fee);
  }

  static Future<int> deleteFee(int id) async {
    final db = await database;
    return await db.delete('fees', where: 'id = ?', whereArgs: [id]);
  }

  // Sync metadata
  static Future<String?> getSyncMeta(String key) async {
    final db = await database;
    final results = await db.query('sync_meta', where: 'key = ?', whereArgs: [key]);
    return results.isNotEmpty ? results.first['value'] as String? : null;
  }

  static Future<void> setSyncMeta(String key, String value) async {
    final db = await database;
    await db.insert(
      'sync_meta',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Clear all data for re-sync
  static Future<void> clearAllData() async {
    final db = await database;
    await db.delete('students');
    await db.delete('attendance');
    await db.delete('grades');
    await db.delete('payments');
    await db.delete('groups_table');
    await db.delete('fees');
    await db.delete('sync_meta');
  }

  // Replace all data from server (full sync)
  static Future<void> replaceStudents(List<Map<String, dynamic>> students) async {
    final db = await database;
    await db.delete('students', where: 'synced = ?', whereArgs: [1]);
    for (final student in students) {
      final map = Map<String, dynamic>.from(student);
      map['synced'] = 1;
      map.remove('createdAt');
      map.remove('updatedAt');
      map.remove('registrationDate');
      await db.insert('students', map, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  static Future<void> replaceAttendance(List<Map<String, dynamic>> attendance) async {
    final db = await database;
    await db.delete('attendance', where: 'synced = ?', whereArgs: [1]);
    for (final record in attendance) {
      final map = Map<String, dynamic>.from(record);
      map['synced'] = 1;
      map.remove('createdAt');
      await db.insert('attendance', map, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  static Future<void> replaceGroups(List<Map<String, dynamic>> groups) async {
    final db = await database;
    await db.delete('groups_table');
    for (final group in groups) {
      final map = Map<String, dynamic>.from(group);
      map.remove('createdAt');
      map.remove('updatedAt');
      await db.insert('groups_table', map, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  static Future<void> replaceFees(List<Map<String, dynamic>> fees) async {
    final db = await database;
    await db.delete('fees');
    for (final fee in fees) {
      final map = Map<String, dynamic>.from(fee);
      map.remove('createdAt');
      await db.insert('fees', map, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  static Future<void> replacePayments(List<Map<String, dynamic>> payments) async {
    final db = await database;
    await db.delete('payments', where: 'synced = ?', whereArgs: [1]);
    for (final payment in payments) {
      final map = Map<String, dynamic>.from(payment);
      map['synced'] = 1;
      map.remove('createdAt');
      await db.insert('payments', map, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }
}

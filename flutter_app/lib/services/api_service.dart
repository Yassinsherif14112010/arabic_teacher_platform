import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Default to localhost, can be configured
  static String _baseUrl = 'http://localhost:3000/api/rest';
  static String? _token;

  static void setBaseUrl(String url) {
    _baseUrl = url;
  }

  static String get baseUrl => _baseUrl;

  static Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  static Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  static String? get token => _token;

  static Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // Auth
  static Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: _headers,
      body: jsonEncode({'username': username, 'password': password}),
    );
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode == 200 && data['token'] != null) {
      await saveToken(data['token'] as String);
    }
    return data;
  }

  static Future<Map<String, dynamic>> register(
    String name,
    String username,
    String password,
    String registerSecret,
  ) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'username': username,
        'password': password,
        'registerSecret': registerSecret,
      }),
    );
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode == 200 && data['token'] != null) {
      await saveToken(data['token'] as String);
    }
    return data;
  }

  static Future<Map<String, dynamic>?> getMe() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/auth/me'),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<void> logout() async {
    try {
      await http.post(Uri.parse('$_baseUrl/auth/logout'), headers: _headers);
    } catch (_) {
      // Ignore logout errors
    }
    await clearToken();
  }

  // Students
  static Future<List<dynamic>> getStudents() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/students'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('فشل في جلب الطلاب');
  }

  static Future<Map<String, dynamic>> createStudent(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/students'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> updateStudent(int id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/students/$id'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<void> deleteStudent(int id) async {
    final response = await http.delete(
      Uri.parse('$_baseUrl/students/$id'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('فشل في حذف الطالب');
    }
  }

  static Future<Map<String, dynamic>?> getStudentByBarcode(String barcode) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/students/barcode/$barcode'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return null;
  }

  // Attendance
  static Future<Map<String, dynamic>> markAttendance(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/attendance'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<List<dynamic>> getTodayAttendance() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/attendance/today'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('فشل في جلب الحضور');
  }

  // Grades
  static Future<Map<String, dynamic>> addGrade(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/grades'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<List<dynamic>> getStudentGrades(int studentId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/grades/student/$studentId'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('فشل في جلب الدرجات');
  }

  // Payments
  static Future<Map<String, dynamic>> addPayment(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/payments'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<List<dynamic>> getAllPayments() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/payments'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('فشل في جلب المدفوعات');
  }

  static Future<List<dynamic>> getStudentPayments(int studentId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/payments/student/$studentId'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('فشل في جلب المدفوعات');
  }

  // Groups
  static Future<List<dynamic>> getGroups() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/groups'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('فشل في جلب المجموعات');
  }

  static Future<Map<String, dynamic>> createGroup(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/groups'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> updateGroup(int id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/groups/$id'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<void> deleteGroup(int id) async {
    final response = await http.delete(
      Uri.parse('$_baseUrl/groups/$id'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('فشل في حذف المجموعة');
    }
  }

  // Fees
  static Future<List<dynamic>> getFees() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/fees'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('فشل في جلب الرسوم');
  }

  static Future<Map<String, dynamic>> createFee(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/fees'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  static Future<void> deleteFee(int id) async {
    final response = await http.delete(
      Uri.parse('$_baseUrl/fees/$id'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('فشل في حذف الرسوم');
    }
  }

  // Sync
  static Future<Map<String, dynamic>> syncData({String? lastSyncTimestamp}) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/sync'),
      headers: _headers,
      body: jsonEncode({'lastSyncTimestamp': lastSyncTimestamp}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception('فشل في المزامنة');
  }
}

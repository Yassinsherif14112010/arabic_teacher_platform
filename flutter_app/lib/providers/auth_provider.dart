import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/sync_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    await ApiService.loadToken();
    if (ApiService.token != null) {
      try {
        final data = await ApiService.getMe();
        if (data != null) {
          _user = User.fromJson(data);
        } else {
          await ApiService.clearToken();
        }
      } catch (_) {
        // Offline mode - keep token, user will be null
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.login(username, password);
      if (data['success'] == true && data['user'] != null) {
        _user = User.fromJson(data['user'] as Map<String, dynamic>);
        _isLoading = false;
        notifyListeners();
        // Sync after login
        SyncService.sync();
        return true;
      } else {
        _error = data['error'] as String? ?? 'فشل في تسجيل الدخول';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'فشل في الاتصال بالسيرفر';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(
    String name,
    String username,
    String password,
    String registerSecret,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.register(name, username, password, registerSecret);
      if (data['success'] == true && data['user'] != null) {
        _user = User.fromJson(data['user'] as Map<String, dynamic>);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['error'] as String? ?? 'فشل في التسجيل';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'فشل في الاتصال بالسيرفر';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.logout();
    _user = null;
    _error = null;
    SyncService.stopPeriodicSync();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

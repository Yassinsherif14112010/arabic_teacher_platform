import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/glass_container.dart';
import '../widgets/gradient_background.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _registerSecretController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLogin = true;
  bool _obscurePassword = true;
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOut,
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _registerSecretController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    bool success;

    if (_isLogin) {
      success = await auth.login(
        _usernameController.text.trim(),
        _passwordController.text,
      );
    } else {
      success = await auth.register(
        _nameController.text.trim(),
        _usernameController.text.trim(),
        _passwordController.text,
        _registerSecretController.text.trim(),
      );
    }

    if (success && mounted) {
      Navigator.of(context).pushReplacementNamed('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;

    return Scaffold(
      body: GradientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(
              horizontal: isTablet ? size.width * 0.2 : 24,
              vertical: 40,
            ),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo/Title
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF3949ab),
                          const Color(0xFF1a237e),
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF3949ab).withOpacity(0.4),
                          blurRadius: 30,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.school,
                      size: 60,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'منصة إدارة الطلاب',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'محسن شاكر',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: const Color(0xFF00bcd4),
                        ),
                  ),
                  const SizedBox(height: 40),

                  // Form
                  GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Tab selector
                          Row(
                            children: [
                              Expanded(
                                child: _buildTabButton('تسجيل الدخول', _isLogin, () {
                                  setState(() => _isLogin = true);
                                }),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildTabButton('حساب جديد', !_isLogin, () {
                                  setState(() => _isLogin = false);
                                }),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          if (!_isLogin) ...[
                            TextFormField(
                              controller: _nameController,
                              decoration: const InputDecoration(
                                labelText: 'الاسم',
                                prefixIcon: Icon(Icons.person_outline),
                              ),
                              textDirection: TextDirection.rtl,
                              validator: (v) =>
                                  v == null || v.isEmpty ? 'الاسم مطلوب' : null,
                            ),
                            const SizedBox(height: 16),
                          ],

                          TextFormField(
                            controller: _usernameController,
                            decoration: const InputDecoration(
                              labelText: 'اسم المستخدم',
                              prefixIcon: Icon(Icons.account_circle_outlined),
                            ),
                            textDirection: TextDirection.rtl,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'اسم المستخدم مطلوب' : null,
                          ),
                          const SizedBox(height: 16),

                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              labelText: 'كلمة المرور',
                              prefixIcon: const Icon(Icons.lock_outline),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                ),
                                onPressed: () {
                                  setState(
                                      () => _obscurePassword = !_obscurePassword);
                                },
                              ),
                            ),
                            textDirection: TextDirection.rtl,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'كلمة المرور مطلوبة' : null,
                          ),

                          if (!_isLogin) ...[
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _registerSecretController,
                              decoration: const InputDecoration(
                                labelText: 'رمز التسجيل',
                                prefixIcon: Icon(Icons.vpn_key_outlined),
                              ),
                              textDirection: TextDirection.rtl,
                              validator: (v) =>
                                  v == null || v.isEmpty ? 'رمز التسجيل مطلوب' : null,
                            ),
                          ],

                          if (auth.error != null) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.red.withOpacity(0.3)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: Colors.red, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      auth.error!,
                                      style: const TextStyle(color: Colors.red),
                                      textDirection: TextDirection.rtl,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          const SizedBox(height: 24),

                          SizedBox(
                            height: 50,
                            child: ElevatedButton(
                              onPressed: auth.isLoading ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3949ab),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: auth.isLoading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Text(
                                      _isLogin ? 'دخول' : 'تسجيل',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton(String text, bool isActive, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive
              ? const Color(0xFF3949ab)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive
                ? const Color(0xFF3949ab)
                : Colors.grey.withOpacity(0.3),
          ),
        ),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.grey,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

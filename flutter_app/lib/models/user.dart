class User {
  final int id;
  final String? name;
  final String username;
  final String role;

  User({
    required this.id,
    this.name,
    required this.username,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      name: json['name'] as String?,
      username: json['username'] as String,
      role: json['role'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'role': role,
    };
  }
}

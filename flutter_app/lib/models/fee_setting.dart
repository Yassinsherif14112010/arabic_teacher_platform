class FeeSetting {
  final int? id;
  final String grade;
  final String amount;
  final String? description;
  final DateTime? createdAt;

  FeeSetting({
    this.id,
    required this.grade,
    required this.amount,
    this.description,
    this.createdAt,
  });

  factory FeeSetting.fromJson(Map<String, dynamic> json) {
    return FeeSetting(
      id: json['id'] as int?,
      grade: json['grade'] as String,
      amount: json['amount']?.toString() ?? '0',
      description: json['description'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'grade': grade,
      'amount': double.tryParse(amount) ?? 0,
      'description': description,
    };
  }

  Map<String, dynamic> toDbMap() {
    return {
      if (id != null) 'id': id,
      'grade': grade,
      'amount': amount,
      'description': description,
    };
  }
}

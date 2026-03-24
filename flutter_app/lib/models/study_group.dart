class StudyGroup {
  final int? id;
  final String name;
  final String grade;
  final String? description;
  final String? schedule;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  StudyGroup({
    this.id,
    required this.name,
    required this.grade,
    this.description,
    this.schedule,
    this.createdAt,
    this.updatedAt,
  });

  factory StudyGroup.fromJson(Map<String, dynamic> json) {
    return StudyGroup(
      id: json['id'] as int?,
      name: json['name'] as String,
      grade: json['grade'] as String,
      description: json['description'] as String?,
      schedule: json['schedule'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'grade': grade,
      'description': description,
      'schedule': schedule,
    };
  }

  Map<String, dynamic> toDbMap() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'grade': grade,
      'description': description,
      'schedule': schedule,
    };
  }
}

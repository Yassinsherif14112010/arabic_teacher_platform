class GradeRecord {
  final int? id;
  final int studentId;
  final String examType; // daily, monthly, final
  final String score;
  final String maxScore;
  final String examDate;
  final String? subject;
  final String? notes;
  final DateTime? createdAt;
  final bool synced;
  final String? localId;

  GradeRecord({
    this.id,
    required this.studentId,
    required this.examType,
    required this.score,
    this.maxScore = '100',
    required this.examDate,
    this.subject,
    this.notes,
    this.createdAt,
    this.synced = true,
    this.localId,
  });

  factory GradeRecord.fromJson(Map<String, dynamic> json) {
    return GradeRecord(
      id: json['id'] as int?,
      studentId: json['studentId'] as int,
      examType: json['examType'] as String,
      score: json['score']?.toString() ?? '0',
      maxScore: json['maxScore']?.toString() ?? '100',
      examDate: json['examDate']?.toString() ?? '',
      subject: json['subject'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      synced: json['synced'] == null || json['synced'] == 1 || json['synced'] == true,
      localId: json['localId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'studentId': studentId,
      'examType': examType,
      'score': double.tryParse(score) ?? 0,
      'maxScore': double.tryParse(maxScore) ?? 100,
      'examDate': examDate,
      'subject': subject,
      'notes': notes,
    };
  }

  Map<String, dynamic> toDbMap() {
    return {
      if (id != null) 'id': id,
      'studentId': studentId,
      'examType': examType,
      'score': score,
      'maxScore': maxScore,
      'examDate': examDate,
      'subject': subject,
      'notes': notes,
      'synced': synced ? 1 : 0,
      'localId': localId,
    };
  }
}

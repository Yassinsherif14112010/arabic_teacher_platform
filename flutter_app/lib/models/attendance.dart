class AttendanceRecord {
  final int? id;
  final int studentId;
  final String attendanceDate;
  final String status; // present, absent, late
  final String? notes;
  final DateTime? createdAt;
  final bool synced;
  final String? localId;

  AttendanceRecord({
    this.id,
    required this.studentId,
    required this.attendanceDate,
    required this.status,
    this.notes,
    this.createdAt,
    this.synced = true,
    this.localId,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id'] as int?,
      studentId: json['studentId'] as int,
      attendanceDate: json['attendanceDate']?.toString() ?? '',
      status: json['status'] as String,
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
      'attendanceDate': attendanceDate,
      'status': status,
      'notes': notes,
    };
  }

  Map<String, dynamic> toDbMap() {
    return {
      if (id != null) 'id': id,
      'studentId': studentId,
      'attendanceDate': attendanceDate,
      'status': status,
      'notes': notes,
      'synced': synced ? 1 : 0,
      'localId': localId,
    };
  }
}

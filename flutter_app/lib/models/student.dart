class Student {
  final int? id;
  final String name;
  final String? phone;
  final String? parentPhone;
  final String barcodeNumber;
  final String? grade;
  final int? groupId;
  final bool feePaid;
  final String status;
  final DateTime? registrationDate;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  // For offline sync
  final bool synced;
  final String? localId;

  Student({
    this.id,
    required this.name,
    this.phone,
    this.parentPhone,
    required this.barcodeNumber,
    this.grade,
    this.groupId,
    this.feePaid = false,
    this.status = 'active',
    this.registrationDate,
    this.createdAt,
    this.updatedAt,
    this.synced = true,
    this.localId,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as int?,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      parentPhone: json['parentPhone'] as String?,
      barcodeNumber: json['barcodeNumber'] as String,
      grade: json['grade'] as String?,
      groupId: json['groupId'] as int?,
      feePaid: json['feePaid'] == true || json['feePaid'] == 1,
      status: (json['status'] as String?) ?? 'active',
      registrationDate: json['registrationDate'] != null
          ? DateTime.tryParse(json['registrationDate'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
      synced: json['synced'] == null || json['synced'] == 1 || json['synced'] == true,
      localId: json['localId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'phone': phone,
      'parentPhone': parentPhone,
      'barcodeNumber': barcodeNumber,
      'grade': grade,
      'groupId': groupId,
      'feePaid': feePaid,
      'status': status,
    };
  }

  Map<String, dynamic> toDbMap() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'phone': phone,
      'parentPhone': parentPhone,
      'barcodeNumber': barcodeNumber,
      'grade': grade,
      'groupId': groupId,
      'feePaid': feePaid ? 1 : 0,
      'status': status,
      'synced': synced ? 1 : 0,
      'localId': localId,
    };
  }

  Student copyWith({
    int? id,
    String? name,
    String? phone,
    String? parentPhone,
    String? barcodeNumber,
    String? grade,
    int? groupId,
    bool? feePaid,
    String? status,
    bool? synced,
    String? localId,
  }) {
    return Student(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      parentPhone: parentPhone ?? this.parentPhone,
      barcodeNumber: barcodeNumber ?? this.barcodeNumber,
      grade: grade ?? this.grade,
      groupId: groupId ?? this.groupId,
      feePaid: feePaid ?? this.feePaid,
      status: status ?? this.status,
      registrationDate: registrationDate,
      createdAt: createdAt,
      updatedAt: updatedAt,
      synced: synced ?? this.synced,
      localId: localId ?? this.localId,
    );
  }
}

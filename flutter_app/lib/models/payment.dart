class Payment {
  final int? id;
  final int studentId;
  final String amount;
  final String paymentDate;
  final String paymentMethod; // cash, transfer, check
  final String? month;
  final String? notes;
  final DateTime? createdAt;
  final bool synced;
  final String? localId;

  Payment({
    this.id,
    required this.studentId,
    required this.amount,
    required this.paymentDate,
    required this.paymentMethod,
    this.month,
    this.notes,
    this.createdAt,
    this.synced = true,
    this.localId,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as int?,
      studentId: json['studentId'] as int,
      amount: json['amount']?.toString() ?? '0',
      paymentDate: json['paymentDate']?.toString() ?? '',
      paymentMethod: json['paymentMethod'] as String,
      month: json['month'] as String?,
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
      'amount': double.tryParse(amount) ?? 0,
      'paymentDate': paymentDate,
      'paymentMethod': paymentMethod,
      'month': month,
      'notes': notes,
    };
  }

  Map<String, dynamic> toDbMap() {
    return {
      if (id != null) 'id': id,
      'studentId': studentId,
      'amount': amount,
      'paymentDate': paymentDate,
      'paymentMethod': paymentMethod,
      'month': month,
      'notes': notes,
      'synced': synced ? 1 : 0,
      'localId': localId,
    };
  }
}

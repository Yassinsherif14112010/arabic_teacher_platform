import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/payment.dart';
import '../models/fee_setting.dart';
import '../providers/data_provider.dart';
import '../widgets/gradient_background.dart';
import '../widgets/glass_container.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;

    return GradientBackground(
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(isTablet ? 24 : 16),
            child: GlassContainer(
              padding: const EdgeInsets.all(4),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: const Color(0xFF3949ab),
                  borderRadius: BorderRadius.circular(12),
                ),
                labelColor: Colors.white,
                unselectedLabelColor: Colors.grey,
                tabs: const [
                  Tab(text: 'المدفوعات', icon: Icon(Icons.payment)),
                  Tab(text: 'الرسوم', icon: Icon(Icons.receipt_long)),
                ],
              ),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _PaymentsTab(data: data, isTablet: isTablet),
                _FeesTab(data: data, isTablet: isTablet),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentsTab extends StatelessWidget {
  final DataProvider data;
  final bool isTablet;

  const _PaymentsTab({required this.data, required this.isTablet});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: isTablet ? 24 : 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'المدفوعات (${data.payments.length})',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                textDirection: TextDirection.rtl,
              ),
              ElevatedButton.icon(
                onPressed: () => _showAddPaymentDialog(context),
                icon: const Icon(Icons.add),
                label: const Text('إضافة دفعة'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: data.payments.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.payment, size: 64, color: Colors.grey.withOpacity(0.5)),
                      const SizedBox(height: 16),
                      Text(
                        'لا توجد مدفوعات',
                        style: TextStyle(color: Colors.grey.withOpacity(0.7), fontSize: 18),
                        textDirection: TextDirection.rtl,
                      ),
                    ],
                  ),
                )
              : isTablet
                  ? _buildTableView(context)
                  : _buildListView(context),
        ),
      ],
    );
  }

  Widget _buildTableView(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassContainer(
        padding: EdgeInsets.zero,
        child: DataTable(
          columns: const [
            DataColumn(label: Text('الطالب', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('المبلغ', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('التاريخ', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('طريقة الدفع', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('الشهر', textDirection: TextDirection.rtl)),
          ],
          rows: data.payments.map((payment) {
            final student = data.students
                .where((s) => s.id == payment.studentId)
                .firstOrNull;
            return DataRow(cells: [
              DataCell(Text(
                student?.name ?? 'طالب #${payment.studentId}',
                textDirection: TextDirection.rtl,
              )),
              DataCell(Text('${payment.amount} ج.م')),
              DataCell(Text(payment.paymentDate)),
              DataCell(Text(_getPaymentMethodLabel(payment.paymentMethod),
                  textDirection: TextDirection.rtl)),
              DataCell(Text(payment.month ?? '-', textDirection: TextDirection.rtl)),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildListView(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: data.payments.length,
      itemBuilder: (context, index) {
        final payment = data.payments[index];
        final student = data.students
            .where((s) => s.id == payment.studentId)
            .firstOrNull;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color: Theme.of(context).cardColor,
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: const CircleAvatar(
              backgroundColor: Color(0xFF6a1b9a),
              child: Icon(Icons.payment, color: Colors.white),
            ),
            title: Text(
              student?.name ?? 'طالب #${payment.studentId}',
              textDirection: TextDirection.rtl,
            ),
            subtitle: Text(
              '${payment.amount} ج.م - ${payment.paymentDate}',
              textDirection: TextDirection.rtl,
            ),
            trailing: Text(
              _getPaymentMethodLabel(payment.paymentMethod),
              style: const TextStyle(fontSize: 12),
              textDirection: TextDirection.rtl,
            ),
          ),
        );
      },
    );
  }

  String _getPaymentMethodLabel(String method) {
    switch (method) {
      case 'cash':
        return 'نقدي';
      case 'transfer':
        return 'تحويل';
      case 'check':
        return 'شيك';
      default:
        return method;
    }
  }

  void _showAddPaymentDialog(BuildContext context) {
    final amountCtrl = TextEditingController();
    final monthCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String paymentMethod = 'cash';
    int? selectedStudentId;
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('إضافة دفعة جديدة', textDirection: TextDirection.rtl, textAlign: TextAlign.center),
          content: SizedBox(
            width: 400,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<int>(
                      value: selectedStudentId,
                      decoration: const InputDecoration(labelText: 'اختر الطالب'),
                      items: data.students.map((s) {
                        return DropdownMenuItem(
                          value: s.id,
                          child: Text(s.name, textDirection: TextDirection.rtl),
                        );
                      }).toList(),
                      onChanged: (v) => setDialogState(() => selectedStudentId = v),
                      validator: (v) => v == null ? 'اختر طالب' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: amountCtrl,
                      decoration: const InputDecoration(labelText: 'المبلغ'),
                      keyboardType: TextInputType.number,
                      validator: (v) => v == null || v.isEmpty ? 'المبلغ مطلوب' : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: paymentMethod,
                      decoration: const InputDecoration(labelText: 'طريقة الدفع'),
                      items: const [
                        DropdownMenuItem(value: 'cash', child: Text('نقدي')),
                        DropdownMenuItem(value: 'transfer', child: Text('تحويل')),
                        DropdownMenuItem(value: 'check', child: Text('شيك')),
                      ],
                      onChanged: (v) => setDialogState(() => paymentMethod = v!),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: monthCtrl,
                      decoration: const InputDecoration(labelText: 'الشهر'),
                      textDirection: TextDirection.rtl,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: notesCtrl,
                      decoration: const InputDecoration(labelText: 'ملاحظات'),
                      textDirection: TextDirection.rtl,
                      maxLines: 2,
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () {
                if (formKey.currentState!.validate()) {
                  final payment = Payment(
                    studentId: selectedStudentId!,
                    amount: amountCtrl.text.trim(),
                    paymentDate: DateTime.now().toIso8601String().split('T')[0],
                    paymentMethod: paymentMethod,
                    month: monthCtrl.text.trim().isEmpty ? null : monthCtrl.text.trim(),
                    notes: notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
                  );
                  context.read<DataProvider>().addPayment(payment);
                  Navigator.pop(ctx);
                }
              },
              child: const Text('إضافة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeesTab extends StatelessWidget {
  final DataProvider data;
  final bool isTablet;

  const _FeesTab({required this.data, required this.isTablet});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: isTablet ? 24 : 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'إعدادات الرسوم (${data.fees.length})',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                textDirection: TextDirection.rtl,
              ),
              ElevatedButton.icon(
                onPressed: () => _showAddFeeDialog(context),
                icon: const Icon(Icons.add),
                label: const Text('إضافة رسم'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: data.fees.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long, size: 64, color: Colors.grey.withOpacity(0.5)),
                      const SizedBox(height: 16),
                      Text(
                        'لا توجد رسوم محددة',
                        style: TextStyle(color: Colors.grey.withOpacity(0.7), fontSize: 18),
                        textDirection: TextDirection.rtl,
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: EdgeInsets.symmetric(horizontal: isTablet ? 24 : 16),
                  itemCount: data.fees.length,
                  itemBuilder: (context, index) {
                    final fee = data.fees[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      color: Theme.of(context).cardColor,
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(12),
                        leading: const CircleAvatar(
                          backgroundColor: Color(0xFF00838f),
                          child: Icon(Icons.receipt, color: Colors.white),
                        ),
                        title: Text(
                          'الصف: ${fee.grade}',
                          textDirection: TextDirection.rtl,
                        ),
                        subtitle: Text(
                          '${fee.amount} ج.م${fee.description != null ? ' - ${fee.description}' : ''}',
                          textDirection: TextDirection.rtl,
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('تأكيد الحذف', textDirection: TextDirection.rtl),
                                content: const Text('هل أنت متأكد من حذف هذا الرسم؟', textDirection: TextDirection.rtl),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx),
                                    child: const Text('إلغاء'),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                    onPressed: () {
                                      context.read<DataProvider>().deleteFee(fee.id!);
                                      Navigator.pop(ctx);
                                    },
                                    child: const Text('حذف'),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  void _showAddFeeDialog(BuildContext context) {
    final gradeCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    final descriptionCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إضافة رسم جديد', textDirection: TextDirection.rtl, textAlign: TextAlign.center),
        content: SizedBox(
          width: 400,
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: gradeCtrl,
                  decoration: const InputDecoration(labelText: 'الصف الدراسي'),
                  textDirection: TextDirection.rtl,
                  validator: (v) => v == null || v.isEmpty ? 'الصف مطلوب' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: amountCtrl,
                  decoration: const InputDecoration(labelText: 'المبلغ'),
                  keyboardType: TextInputType.number,
                  validator: (v) => v == null || v.isEmpty ? 'المبلغ مطلوب' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descriptionCtrl,
                  decoration: const InputDecoration(labelText: 'الوصف'),
                  textDirection: TextDirection.rtl,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              if (formKey.currentState!.validate()) {
                final fee = FeeSetting(
                  grade: gradeCtrl.text.trim(),
                  amount: amountCtrl.text.trim(),
                  description: descriptionCtrl.text.trim().isEmpty
                      ? null
                      : descriptionCtrl.text.trim(),
                );
                context.read<DataProvider>().addFee(fee);
                Navigator.pop(ctx);
              }
            },
            child: const Text('إضافة'),
          ),
        ],
      ),
    );
  }
}

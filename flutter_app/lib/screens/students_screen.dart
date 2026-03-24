import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/student.dart';
import '../providers/data_provider.dart';
import '../widgets/gradient_background.dart';
import '../widgets/glass_container.dart';
import '../widgets/barcode_display.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  String _searchQuery = '';
  String? _filterGrade;

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;

    var filteredStudents = data.students.where((s) {
      final matchesSearch = s.name.contains(_searchQuery) ||
          s.barcodeNumber.contains(_searchQuery) ||
          (s.phone ?? '').contains(_searchQuery);
      final matchesGrade = _filterGrade == null || s.grade == _filterGrade;
      return matchesSearch && matchesGrade;
    }).toList();

    return GradientBackground(
      child: Column(
        children: [
          // Search bar
          Padding(
            padding: EdgeInsets.all(isTablet ? 24 : 16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (v) => setState(() => _searchQuery = v),
                    decoration: InputDecoration(
                      hintText: 'بحث عن طالب...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () => _showAddStudentDialog(context),
                  icon: const Icon(Icons.add),
                  label: const Text('إضافة طالب'),
                ),
              ],
            ),
          ),

          // Students list
          Expanded(
            child: data.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredStudents.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline,
                                size: 64, color: Colors.grey.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            Text(
                              'لا يوجد طلاب',
                              style: TextStyle(
                                  color: Colors.grey.withOpacity(0.7),
                                  fontSize: 18),
                            ),
                          ],
                        ),
                      )
                    : isTablet
                        ? _buildTableView(filteredStudents, data)
                        : _buildListView(filteredStudents, data),
          ),
        ],
      ),
    );
  }

  Widget _buildTableView(List<Student> students, DataProvider data) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassContainer(
        padding: EdgeInsets.zero,
        child: DataTable(
          columnSpacing: 24,
          columns: const [
            DataColumn(label: Text('الاسم', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('الهاتف', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('الصف', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('الحالة', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('الباركود', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('إجراءات', textDirection: TextDirection.rtl)),
          ],
          rows: students.map((student) {
            return DataRow(cells: [
              DataCell(Text(student.name, textDirection: TextDirection.rtl)),
              DataCell(Text(student.phone ?? '-')),
              DataCell(Text(student.grade ?? '-', textDirection: TextDirection.rtl)),
              DataCell(_buildStatusBadge(student.status)),
              DataCell(
                TextButton(
                  onPressed: () => _showBarcodeDialog(student),
                  child: Text(student.barcodeNumber),
                ),
              ),
              DataCell(Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blue, size: 20),
                    onPressed: () => _showEditStudentDialog(context, student),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                    onPressed: () => _confirmDelete(context, data, student),
                  ),
                ],
              )),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildListView(List<Student> students, DataProvider data) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: students.length,
      itemBuilder: (context, index) {
        final student = students[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color: Theme.of(context).cardColor,
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: CircleAvatar(
              backgroundColor: const Color(0xFF3949ab),
              child: Text(
                student.name.isNotEmpty ? student.name[0] : '?',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(student.name, textDirection: TextDirection.rtl),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (student.phone != null)
                  Text(student.phone!, style: const TextStyle(fontSize: 12)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    _buildStatusBadge(student.status),
                    const SizedBox(width: 8),
                    if (student.grade != null)
                      Text(student.grade!,
                          style: const TextStyle(fontSize: 12),
                          textDirection: TextDirection.rtl),
                  ],
                ),
              ],
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) {
                switch (value) {
                  case 'edit':
                    _showEditStudentDialog(context, student);
                    break;
                  case 'barcode':
                    _showBarcodeDialog(student);
                    break;
                  case 'delete':
                    _confirmDelete(context, data, student);
                    break;
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'edit', child: Text('تعديل', textDirection: TextDirection.rtl)),
                const PopupMenuItem(value: 'barcode', child: Text('عرض الباركود', textDirection: TextDirection.rtl)),
                const PopupMenuItem(value: 'delete', child: Text('حذف', textDirection: TextDirection.rtl)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String text;
    switch (status) {
      case 'active':
        color = Colors.green;
        text = 'نشط';
        break;
      case 'inactive':
        color = Colors.red;
        text = 'غير نشط';
        break;
      default:
        color = Colors.grey;
        text = status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 12)),
    );
  }

  void _showBarcodeDialog(Student student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(student.name, textDirection: TextDirection.rtl, textAlign: TextAlign.center),
        content: BarcodeDisplay(
          barcodeNumber: student.barcodeNumber,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }

  void _showAddStudentDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final parentPhoneCtrl = TextEditingController();
    final gradeCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إضافة طالب جديد', textDirection: TextDirection.rtl, textAlign: TextAlign.center),
        content: SizedBox(
          width: 400,
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'اسم الطالب'),
                    textDirection: TextDirection.rtl,
                    validator: (v) => v == null || v.isEmpty ? 'الاسم مطلوب' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: phoneCtrl,
                    decoration: const InputDecoration(labelText: 'رقم الهاتف'),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: parentPhoneCtrl,
                    decoration: const InputDecoration(labelText: 'هاتف ولي الأمر'),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: gradeCtrl,
                    decoration: const InputDecoration(labelText: 'الصف الدراسي'),
                    textDirection: TextDirection.rtl,
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
                final barcode = '${DateTime.now().millisecondsSinceEpoch}${Random().nextInt(999)}'.padLeft(12, '0');
                final student = Student(
                  name: nameCtrl.text.trim(),
                  phone: phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                  parentPhone: parentPhoneCtrl.text.trim().isEmpty ? null : parentPhoneCtrl.text.trim(),
                  barcodeNumber: barcode,
                  grade: gradeCtrl.text.trim().isEmpty ? null : gradeCtrl.text.trim(),
                );
                context.read<DataProvider>().addStudent(student);
                Navigator.pop(ctx);
              }
            },
            child: const Text('إضافة'),
          ),
        ],
      ),
    );
  }

  void _showEditStudentDialog(BuildContext context, Student student) {
    final nameCtrl = TextEditingController(text: student.name);
    final phoneCtrl = TextEditingController(text: student.phone ?? '');
    final parentPhoneCtrl = TextEditingController(text: student.parentPhone ?? '');
    final gradeCtrl = TextEditingController(text: student.grade ?? '');
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تعديل بيانات الطالب', textDirection: TextDirection.rtl, textAlign: TextAlign.center),
        content: SizedBox(
          width: 400,
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'اسم الطالب'),
                    textDirection: TextDirection.rtl,
                    validator: (v) => v == null || v.isEmpty ? 'الاسم مطلوب' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: phoneCtrl,
                    decoration: const InputDecoration(labelText: 'رقم الهاتف'),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: parentPhoneCtrl,
                    decoration: const InputDecoration(labelText: 'هاتف ولي الأمر'),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: gradeCtrl,
                    decoration: const InputDecoration(labelText: 'الصف الدراسي'),
                    textDirection: TextDirection.rtl,
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
                final updated = student.copyWith(
                  name: nameCtrl.text.trim(),
                  phone: phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                  parentPhone: parentPhoneCtrl.text.trim().isEmpty ? null : parentPhoneCtrl.text.trim(),
                  grade: gradeCtrl.text.trim().isEmpty ? null : gradeCtrl.text.trim(),
                );
                context.read<DataProvider>().updateStudent(student.id!, updated);
                Navigator.pop(ctx);
              }
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, DataProvider data, Student student) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تأكيد الحذف', textDirection: TextDirection.rtl),
        content: Text(
          'هل أنت متأكد من حذف الطالب "${student.name}"؟',
          textDirection: TextDirection.rtl,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              data.deleteStudent(student.id!);
              Navigator.pop(ctx);
            },
            child: const Text('حذف'),
          ),
        ],
      ),
    );
  }
}

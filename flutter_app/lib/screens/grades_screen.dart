import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/grade.dart';
import '../providers/data_provider.dart';
import '../widgets/gradient_background.dart';
import '../widgets/glass_container.dart';

class GradesScreen extends StatefulWidget {
  const GradesScreen({super.key});

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
  int? _selectedStudentId;
  List<GradeRecord> _grades = [];
  bool _loadingGrades = false;

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;

    return GradientBackground(
      child: Column(
        children: [
          // Student selector + add button
          Padding(
            padding: EdgeInsets.all(isTablet ? 24 : 16),
            child: GlassContainer(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text(
                    'الدرجات والامتحانات',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          value: _selectedStudentId,
                          decoration: const InputDecoration(
                            labelText: 'اختر الطالب',
                            prefixIcon: Icon(Icons.person),
                          ),
                          items: data.students.map((s) {
                            return DropdownMenuItem(
                              value: s.id,
                              child: Text(s.name, textDirection: TextDirection.rtl),
                            );
                          }).toList(),
                          onChanged: (v) {
                            setState(() => _selectedStudentId = v);
                            if (v != null) _loadStudentGrades(data, v);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton.icon(
                        onPressed: _selectedStudentId != null
                            ? () => _showAddGradeDialog(context, data)
                            : null,
                        icon: const Icon(Icons.add),
                        label: const Text('إضافة درجة'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Grades list
          Expanded(
            child: _selectedStudentId == null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.school, size: 64, color: Colors.grey.withOpacity(0.5)),
                        const SizedBox(height: 16),
                        Text(
                          'اختر طالباً لعرض درجاته',
                          style: TextStyle(color: Colors.grey.withOpacity(0.7), fontSize: 18),
                          textDirection: TextDirection.rtl,
                        ),
                      ],
                    ),
                  )
                : _loadingGrades
                    ? const Center(child: CircularProgressIndicator())
                    : _grades.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.assignment, size: 64, color: Colors.grey.withOpacity(0.5)),
                                const SizedBox(height: 16),
                                Text(
                                  'لا توجد درجات مسجلة',
                                  style: TextStyle(color: Colors.grey.withOpacity(0.7), fontSize: 18),
                                  textDirection: TextDirection.rtl,
                                ),
                              ],
                            ),
                          )
                        : isTablet
                            ? _buildTableView()
                            : _buildListView(),
          ),
        ],
      ),
    );
  }

  Widget _buildTableView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassContainer(
        padding: EdgeInsets.zero,
        child: DataTable(
          columns: const [
            DataColumn(label: Text('نوع الامتحان', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('الدرجة', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('من', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('التاريخ', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('المادة', textDirection: TextDirection.rtl)),
            DataColumn(label: Text('ملاحظات', textDirection: TextDirection.rtl)),
          ],
          rows: _grades.map((grade) {
            return DataRow(cells: [
              DataCell(Text(_getExamTypeLabel(grade.examType), textDirection: TextDirection.rtl)),
              DataCell(Text(grade.score)),
              DataCell(Text(grade.maxScore)),
              DataCell(Text(grade.examDate)),
              DataCell(Text(grade.subject ?? '-', textDirection: TextDirection.rtl)),
              DataCell(Text(grade.notes ?? '-', textDirection: TextDirection.rtl)),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildListView() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _grades.length,
      itemBuilder: (context, index) {
        final grade = _grades[index];
        final score = double.tryParse(grade.score) ?? 0;
        final maxScore = double.tryParse(grade.maxScore) ?? 100;
        final percentage = maxScore > 0 ? (score / maxScore * 100) : 0;

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          color: Theme.of(context).cardColor,
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: CircleAvatar(
              backgroundColor: percentage >= 80
                  ? Colors.green
                  : percentage >= 60
                      ? Colors.orange
                      : Colors.red,
              child: Text(
                '${percentage.toInt()}%',
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(
              _getExamTypeLabel(grade.examType),
              textDirection: TextDirection.rtl,
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${grade.score} / ${grade.maxScore}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(grade.examDate, style: const TextStyle(fontSize: 12)),
                if (grade.subject != null)
                  Text(grade.subject!, textDirection: TextDirection.rtl, style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        );
      },
    );
  }

  String _getExamTypeLabel(String type) {
    switch (type) {
      case 'daily':
        return 'يومي';
      case 'monthly':
        return 'شهري';
      case 'final':
        return 'نهائي';
      default:
        return type;
    }
  }

  Future<void> _loadStudentGrades(DataProvider data, int studentId) async {
    setState(() => _loadingGrades = true);
    final grades = await data.getStudentGrades(studentId);
    setState(() {
      _grades = grades;
      _loadingGrades = false;
    });
  }

  void _showAddGradeDialog(BuildContext context, DataProvider data) {
    final scoreCtrl = TextEditingController();
    final maxScoreCtrl = TextEditingController(text: '100');
    final subjectCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String examType = 'daily';
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('إضافة درجة جديدة', textDirection: TextDirection.rtl, textAlign: TextAlign.center),
          content: SizedBox(
            width: 400,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      value: examType,
                      decoration: const InputDecoration(labelText: 'نوع الامتحان'),
                      items: const [
                        DropdownMenuItem(value: 'daily', child: Text('يومي')),
                        DropdownMenuItem(value: 'monthly', child: Text('شهري')),
                        DropdownMenuItem(value: 'final', child: Text('نهائي')),
                      ],
                      onChanged: (v) => setDialogState(() => examType = v!),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: scoreCtrl,
                      decoration: const InputDecoration(labelText: 'الدرجة'),
                      keyboardType: TextInputType.number,
                      validator: (v) => v == null || v.isEmpty ? 'الدرجة مطلوبة' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: maxScoreCtrl,
                      decoration: const InputDecoration(labelText: 'الدرجة الكاملة'),
                      keyboardType: TextInputType.number,
                      validator: (v) => v == null || v.isEmpty ? 'الدرجة الكاملة مطلوبة' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: subjectCtrl,
                      decoration: const InputDecoration(labelText: 'المادة'),
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
                  final grade = GradeRecord(
                    studentId: _selectedStudentId!,
                    examType: examType,
                    score: scoreCtrl.text.trim(),
                    maxScore: maxScoreCtrl.text.trim(),
                    examDate: DateTime.now().toIso8601String().split('T')[0],
                    subject: subjectCtrl.text.trim().isEmpty ? null : subjectCtrl.text.trim(),
                    notes: notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
                  );
                  data.addGrade(grade);
                  Navigator.pop(ctx);
                  _loadStudentGrades(data, _selectedStudentId!);
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

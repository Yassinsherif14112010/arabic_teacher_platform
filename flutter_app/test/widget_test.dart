import 'package:flutter_test/flutter_test.dart';

import 'package:arabic_teacher_app/main.dart';

void main() {
  testWidgets('App builds successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const ArabicTeacherApp());
    await tester.pumpAndSettle();
  });
}

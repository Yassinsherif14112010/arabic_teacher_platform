import 'package:flutter/material.dart';
import 'package:barcode_widget/barcode_widget.dart';

class BarcodeDisplay extends StatelessWidget {
  final String barcodeNumber;
  final String? studentName;
  final double height;
  final double width;

  const BarcodeDisplay({
    super.key,
    required this.barcodeNumber,
    this.studentName,
    this.height = 80,
    this.width = 200,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (studentName != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              studentName!,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
          ),
          child: BarcodeWidget(
            barcode: Barcode.code128(),
            data: barcodeNumber,
            width: width,
            height: height,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.black,
            ),
          ),
        ),
      ],
    );
  }
}

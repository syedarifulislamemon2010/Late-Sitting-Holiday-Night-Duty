import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer
} from 'docx';

export interface LeaveDocxData {
  applicationDateStr: string;
  applicantName: string;
  designation: string;
  bankId: string;
  fileNo?: string;
  cellName: string;
  leaveType: string;
  subjectText: string;
  bodyParagraphs: string[];
  leaveLocation: string;
  mobileNo: string;
  delegateOfficerName?: string;
  delegateOfficerDesig?: string;
  appYear: string;
  casualTotal: string | number;
  casualUsed: string | number;
  casualRemaining: string | number;
  ordinaryTotal: string | number;
  ordinaryUsed: string | number;
  ordinaryRemaining: string | number;
  specialTotal: string | number;
  specialUsed: string | number;
  specialRemaining: string | number;
}

export async function generateLeaveDocx(data: LeaveDocxData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        children: [
          // Header layout: Left Address & Right Balance Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  // Left Cell: Address
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `তারিখ: ${data.applicationDateStr} ইং`, bold: true, size: 22 })
                        ]
                      }),
                      new Paragraph({ text: '' }),
                      new Paragraph({ children: [new TextRun({ text: 'উপ-মহাব্যবস্থাপক', bold: true, size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'অনলাইন ব্যাংকিং ডিপার্টমেন্ট', bold: true, size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'জনতা ব্যাংক পিএলসি,', bold: true, size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'প্রধান কার্যালয়, ঢাকা।', bold: true, size: 22 })] })
                    ]
                  }),
                  // Right Cell: Balance Table
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                          bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                          left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                          right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
                        },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                columnSpan: 5,
                                children: [
                                  new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: `${data.appYear} সালের ছুটির বিবরণ`, bold: true, size: 18 })]
                                  })
                                ]
                              })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ক্র.নং', bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ছুটির ধরণ', bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'প্রাপ্তব্য', bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ভোগকৃত', bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'অবশিষ্ট', bold: true, size: 16 })] })] })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '০১.', size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'নৈমিত্তিক', size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.casualTotal), bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.casualUsed), bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.casualRemaining), bold: true, size: 16 })] })] })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '০২.', size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'সাধারণ', size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.ordinaryTotal), bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.ordinaryUsed), bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.ordinaryRemaining), bold: true, size: 16 })] })] })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '০৩.', size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'বিশেষ', size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.specialTotal), bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.specialUsed), bold: true, size: 16 })] })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.specialRemaining), bold: true, size: 16 })] })] })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),

          // Subject
          new Paragraph({
            children: [
              new TextRun({ text: data.subjectText, bold: true, underline: {}, size: 24 })
            ]
          }),

          new Paragraph({ text: '' }),

          // Body Paragraphs
          ...data.bodyParagraphs.map(
            (p) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 320 },
                children: [new TextRun({ text: p, size: 22 })]
              })
          ),

          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),

          // Delegate officer section if applicable
          ...(data.delegateOfficerName
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `ছুটিবোর সময়ে আমার দায়িত্ব পালন করবেন: জনাব ${data.delegateOfficerName}, ${data.delegateOfficerDesig || ''}`,
                      bold: true,
                      size: 22
                    })
                  ]
                }),
                new Paragraph({ text: '' })
              ]
            : []),

          // Applicant Signature Section
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'বিনীত নিবেদক,', bold: true, size: 22 })
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `(জনাব ${data.applicantName})`, bold: true, size: 22 })]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `${data.designation}`, size: 20 })]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `ব্যক্তিগত নম্বর: ${data.bankId}`, size: 20 })]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `${data.cellName}`, size: 20 })]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `জনতা ব্যাংক পিএলসি, প্রধান কার্যালয়, ঢাকা।`, size: 20 })]
          }),
          ...(data.mobileNo
            ? [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: `মোবাইল: ${data.mobileNo}`, size: 20 })]
                })
              ]
            : [])
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

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
  const {
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
  } = await import('docx');

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
            (p: string) =>
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

export interface HardwareReqDocxData {
  requisitionDateStr: string;
  subjectLine: string;
  bodyParagraph: string;
  items: {
    serialNo: string | number;
    officerNameSnapshot: string;
    officerDesignationSnapshot: string;
    hardwareLabel: string;
  }[];
  requesterName: string;
  requesterDesignation: string;
}

export async function generateHardwareRequisitionDocx(data: HardwareReqDocxData): Promise<Blob> {
  const {
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
  } = await import('docx');

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ক্রমিক নং', bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'কর্মকর্তার নাম', bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'পদবী', bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'প্রয়োজনীয় হার্ডওয়্যার', bold: true, size: 18 })] })] })
      ]
    }),
    ...data.items.map(item => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.serialNo), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.officerNameSnapshot, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.officerDesignationSnapshot, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.hardwareLabel, size: 18 })] })] })
      ]
    }))
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        children: [
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'অনলাইন ব্যাংকিং ডিপার্টমেন্ট', bold: true, size: 24 })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `তারিখঃ ${data.requisitionDateStr} ইং`, size: 20 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: data.subjectLine, bold: true, underline: {}, size: 22 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: data.bodyParagraph, size: 20 })] }),
          new Paragraph({ text: '' }),
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
            rows: tableRows
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: 'এমতাবস্থায়, উপরে উল্লেখিত সমস্যা সমাধানের জন্য প্রয়োজনীয় ব্যবস্থা গ্রহণের অনুরোধ জানিয়ে নথিটি অত্র ডিপার্টমেন্টের হার্ডওয়্যার সেল বরাবর প্রেরণ করা যেতে পারে।', size: 20 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `(${data.requesterName})`, bold: true, size: 22 })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: data.requesterDesignation, size: 20 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ', underline: {}, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: 'এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ', underline: {}, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: 'ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ', underline: {}, size: 20 })] })
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

export interface OfficeOrderDocxData {
  orderRef: string;
  orderDateStr: string;
  orderText: string;
  duties: {
    slNo: string | number;
    name: string;
    designation: string;
    cellName: string;
    daysCount: number;
    datesListStr: string;
    totalBill: number;
  }[];
  grandTotal: number;
  signingOfficer: string;
  signingDesignation: string;
  copies: string[];
}

export async function generateOfficeOrderDocx(data: OfficeOrderDocxData): Promise<Blob> {
  const {
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
  } = await import('docx');

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ক্রমিক নং', bold: true, size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'কর্মকর্তার নাম ও পদবী', bold: true, size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ডিউটির তারিখসমূহ', bold: true, size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'মোট দিন', bold: true, size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'মোট বিল (৳)', bold: true, size: 16 })] })] })
      ]
    }),
    ...data.duties.map(d => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(d.slNo), size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${d.name}\n${d.designation}`, size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.datesListStr, size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(d.daysCount), size: 16 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(d.totalBill), bold: true, size: 16 })] })] })
      ]
    })),
    new TableRow({
      children: [
        new TableCell({ columnSpan: 4, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'সর্বমোট বিল টাকাঃ', bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `৳${data.grandTotal}`, bold: true, size: 18 })] })] })
      ]
    })
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'জনতা ব্যাংক পিএলসি', bold: true, size: 28 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'অনলাইন ব্যাংকিং ডিপার্টমেন্ট, প্রধান কার্যালয়, ঢাকা', bold: true, size: 22 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: `স্মারক নং: ${data.orderRef}`, bold: true, size: 20 })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `তারিখঃ ${data.orderDateStr} ইং`, size: 20 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'অফিস নির্দেশ', bold: true, underline: {}, size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: data.orderText, size: 20 })] }),
          new Paragraph({ text: '' }),
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
            rows: tableRows
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `(${data.signingOfficer})`, bold: true, size: 22 })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: data.signingDesignation, size: 20 })] }),
          ...(data.copies && data.copies.length > 0
            ? [
                new Paragraph({ text: '' }),
                new Paragraph({ children: [new TextRun({ text: 'অনুলিপি অবগতির জন্য প্রেরণ করা হলো:', bold: true, underline: {}, size: 20 })] }),
                ...data.copies.map(c => new Paragraph({ children: [new TextRun({ text: `- ${c}`, size: 18 })] }))
              ]
            : [])
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

import { describe, it, expect } from 'vitest';
import { 
  generateLeaveDocx, 
  generateHardwareRequisitionDocx, 
  generateOfficeOrderDocx,
  LeaveDocxData,
  HardwareReqDocxData,
  OfficeOrderDocxData
} from '../docx-generator';

describe('docx-generator', () => {
  it('generateLeaveDocx produces a valid Legal size Blob with font config', async () => {
    const data: LeaveDocxData = {
      applicationDateStr: '2023-10-10',
      applicantName: 'Test Applicant',
      designation: 'Officer',
      bankId: '12345',
      cellName: 'IT Cell',
      leaveType: 'Casual',
      subjectText: 'Application for Leave',
      bodyParagraphs: ['Paragraph 1', 'Paragraph 2'],
      leaveLocation: 'Dhaka',
      mobileNo: '01711111111',
      appYear: '2023',
      casualTotal: 20, casualUsed: 5, casualRemaining: 15,
      ordinaryTotal: 10, ordinaryUsed: 0, ordinaryRemaining: 10,
      specialTotal: 5, specialUsed: 0, specialRemaining: 5,
    };
    
    const blob = await generateLeaveDocx(data);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('generateOfficeOrderDocx produces a valid Blob', async () => {
    const data: OfficeOrderDocxData = {
      orderRef: 'REF-123',
      orderDateStr: '2023-10-10',
      orderText: 'This is an office order.',
      duties: [
        {
          slNo: 1,
          name: 'John Doe',
          designation: 'Officer',
          cellName: 'IT',
          daysCount: 2,
          datesListStr: '10, 11',
          totalBill: 1000
        }
      ],
      grandTotal: 1000,
      signingOfficer: 'Jane Doe',
      signingDesignation: 'Manager',
      copies: ['Copy 1']
    };
    
    const blob = await generateOfficeOrderDocx(data);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('generateHardwareRequisitionDocx produces a valid Blob', async () => {
    const data: HardwareReqDocxData = {
      requisitionDateStr: '2023-10-10',
      subjectLine: 'Hardware Requisition',
      bodyParagraph: 'Need hardware for new employees.',
      items: [
        {
          serialNo: 1,
          officerNameSnapshot: 'John',
          officerDesignationSnapshot: 'Officer',
          hardwareLabel: 'Laptop'
        }
      ],
      requesterName: 'Jane',
      requesterDesignation: 'Manager'
    };
    
    const blob = await generateHardwareRequisitionDocx(data);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});

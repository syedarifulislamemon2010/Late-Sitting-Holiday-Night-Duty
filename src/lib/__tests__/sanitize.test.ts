import { describe, it, expect } from 'vitest';
import { sanitizeOrderHtml } from '../sanitize';

describe('sanitizeOrderHtml - DOMPurify Robustness', () => {
  it('preserves valid Bengali bank office order HTML unchanged', () => {
    const validBengaliOrder = `
      <p style="text-align: justify; line-height: 1.6;">
        জনতা ব্যাংক পিএলসি, লোকাল অফিস ঢাকা কর্তৃক আয়োজিত <strong>জরুরি মিটিং</strong> উপলক্ষে 
        নিম্নবর্ণিত <span style="color: #000; font-weight: bold;">কর্মকর্তাগণ</span> ডিউটি পালন করবেন।
      </p>
      <table border="1" cellpadding="4" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="text-align: center;">ক্রমিক</th>
            <th style="text-align: left;">নাম ও পদবী</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">১</td>
            <td style="text-align: left;">জনাব মোঃ কামরুল হাসান, প্রিন্সিপাল অফিসার</td>
          </tr>
        </tbody>
      </table>
    `.trim();

    const sanitized = sanitizeOrderHtml(validBengaliOrder);
    expect(sanitized).toContain('জরুরি মিটিং');
    expect(sanitized).toContain('strong');
    expect(sanitized).toContain('table');
    expect(sanitized).toContain('জনাব মোঃ কামরুল হাসান');
    expect(sanitized).toContain('text-align: justify');
  });

  it('strips <script> tags and executable JavaScript', () => {
    const malicious = '<p>অফিস আদেশ</p><script>alert("XSS")</script><script src="https://evil.com/hax.js"></script>';
    const sanitized = sanitizeOrderHtml(malicious);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).not.toContain('evil.com');
    expect(sanitized).toContain('<p>অফিস আদেশ</p>');
  });

  it('strips inline event handlers like onerror, onclick, onmouseover', () => {
    const malicious = '<span onmouseover="alert(1)" onclick="steal()" style="color: red;">জরুরি নোটিশ</span><img src="x" onerror="alert(2)" />';
    const sanitized = sanitizeOrderHtml(malicious);
    expect(sanitized).not.toContain('onmouseover');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('style="color: red;"');
  });

  describe('3 Regex Bypass Payloads (Blocked)', () => {
    it('blocks <img/src=x/onerror=alert(1)>', () => {
      const payload = '<img/src=x/onerror=alert(1)>';
      const clean = sanitizeOrderHtml(payload);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      expect(clean).not.toContain('<img');
    });

    it('blocks <svg/onload=alert(1)>', () => {
      const payload = '<svg/onload=alert(1)>';
      const clean = sanitizeOrderHtml(payload);
      expect(clean).not.toContain('onload');
      expect(clean).not.toContain('alert');
      expect(clean).not.toContain('<svg');
    });

    it('blocks <div/onmouseover=alert(1)>', () => {
      const payload = '<div/onmouseover=alert(1)>নোট</div>';
      const clean = sanitizeOrderHtml(payload);
      expect(clean).not.toContain('onmouseover');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('নোট');
    });
  });

  describe('10 Additional Advanced Bypass Payloads (Blocked)', () => {
    it('1. mixed-case tags: <sCrIpt>alert(1)</sCrIpt>', () => {
      const clean = sanitizeOrderHtml('<sCrIpt>alert(1)</sCrIpt>');
      expect(clean).toBe('');
    });

    it('2. mixed-case event handler: <div OnMouseOver="alert(1)">Test</div>', () => {
      const clean = sanitizeOrderHtml('<div OnMouseOver="alert(1)">Test</div>');
      expect(clean).not.toContain('OnMouseOver');
      expect(clean).not.toContain('alert');
    });

    it('3. nested script tags: <script><script>alert(1)</script></script>', () => {
      const clean = sanitizeOrderHtml('<script><script>alert(1)</script></script>');
      expect(clean).not.toContain('<script');
      expect(clean).toBe('');
    });

    it('4. javascript: protocol in href or style', () => {
      const clean = sanitizeOrderHtml('<div style="background-image: url(javascript:alert(1))">Test</div>');
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('style');
    });

    it('5. CSS expression: <div style="width: expression(alert(1))">Test</div>', () => {
      const clean = sanitizeOrderHtml('<div style="width: expression(alert(1))">Test</div>');
      expect(clean).not.toContain('expression');
      expect(clean).not.toContain('style');
    });

    it('6. MathML XSS: <math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>', () => {
      const clean = sanitizeOrderHtml('<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>');
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      expect(clean).not.toContain('<math');
    });

    it('7. SVG use/animate tag bypass: <svg><use href="data:image/svg+xml,..."></use></svg>', () => {
      const clean = sanitizeOrderHtml('<svg><animate onbegin=alert(1) attributeName=x></svg>');
      expect(clean).not.toContain('animate');
      expect(clean).not.toContain('onbegin');
      expect(clean).not.toContain('alert');
    });

    it('8. HTML entity-encoded script in event: <p onclick="&apos;alert(1)&apos;">Paragraph</p>', () => {
      const clean = sanitizeOrderHtml('<p onclick="&apos;alert(1)&apos;">Paragraph</p>');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
    });

    it('9. iframe injection: <iframe src="javascript:alert(1)"></iframe>', () => {
      const clean = sanitizeOrderHtml('<iframe src="javascript:alert(1)"></iframe>');
      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('alert');
    });

    it('10. object / embed injection: <object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="></object>', () => {
      const clean = sanitizeOrderHtml('<object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="></object>');
      expect(clean).not.toContain('<object');
      expect(clean).not.toContain('base64');
    });
  });
});

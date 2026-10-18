import { describe, it, expect } from 'vitest';
import { sanitizeOrderHtml } from '../sanitize';

describe('sanitizeOrderHtml', () => {
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
    expect(sanitized).toContain('জরুরি নোটিশ');
  });

  it('strips iframes, embeds, and objects', () => {
    const malicious = '<p>টেক্সট</p><iframe src="https://attacker.com/evil"></iframe><embed src="evil.swf" />';
    const sanitized = sanitizeOrderHtml(malicious);
    expect(sanitized).not.toContain('<iframe');
    expect(sanitized).not.toContain('<embed');
    expect(sanitized).not.toContain('attacker.com');
    expect(sanitized).toContain('<p>টেক্সট</p>');
  });

  it('neutralizes javascript: URLs in styles and links', () => {
    const malicious = '<p style="background: url(javascript:alert(1))">পরীক্ষা</p>';
    const sanitized = sanitizeOrderHtml(malicious);
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('পরীক্ষা');
  });
});

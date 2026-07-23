import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = path.resolve(import.meta.dirname);
const renderer = fs.readFileSync(path.join(sourceRoot, 'renderer.tsx'), 'utf8');
const styles = fs.readFileSync(path.join(sourceRoot, 'index.css'), 'utf8');
const preload = fs.readFileSync(path.join(sourceRoot, 'preload.ts'), 'utf8');
const main = fs.readFileSync(path.join(sourceRoot, 'main.ts'), 'utf8');

describe('Managed Esse UI contract', () => {
  it('keeps channel-specific names out of the renderer', () => {
    expect(renderer).not.toContain('兔子');
    expect(renderer).not.toContain('Tuzi');
    expect(renderer).toContain('高级配置');
    expect(renderer).toContain('Esse Key');
    expect(renderer).toContain('>高级设置</button>');
    expect(renderer).not.toContain('className="onboarding-close"');
  });

  it('keeps gallery thumbnails at the same width while only the column count changes', () => {
    expect(styles).toMatch(/--gallery-thumbnail-size:\s*182px/);
    expect(styles).toMatch(/\.image-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill, var\(--gallery-thumbnail-size\)\)/);
    expect(styles).not.toContain('.image-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }');
    expect(styles).not.toContain('.image-grid { grid-template-columns: 1fr !important; }');
  });

  it('shows a batch-level retry action and keeps currency out of model dropdowns', () => {
    expect(renderer).toContain('retry-all-button');
    expect(renderer).toContain('重试失败任务');
    expect(renderer).not.toContain('确认重试');
    expect(renderer).toContain('retryAllFailedSelection(batch)');
    expect(renderer).toContain("job.operation !== 'agent' ? <button");
    expect(renderer).not.toContain('job.retryable ? <button');
    expect(renderer).toContain('setEsseConcurrency');
    expect(renderer).toContain('并发任务数');
    expect(renderer).not.toMatch(/<option[^>]*>[^<]*¥/);
  });

  it('shows prompt and references when a pending task is hovered or focused', () => {
    expect(renderer).toContain('pending-task-peek');
    expect(renderer).toContain('data-pending-task');
    expect(renderer).toContain('提示词');
    expect(renderer).toContain('张参考图');
    expect(styles).toContain('.pending-task-peek');
    expect(styles).toContain('.image-card[data-pending-task="true"]:focus-visible');
  });

  it('copies exact batch and image references through the native clipboard bridge', () => {
    expect(renderer).toContain('className="batch-reference-copy"');
    expect(renderer).toContain('复制批次名称和 ID');
    expect(renderer).toContain('复制图片 ID');
    expect(preload).toContain("'references:copy-batch'");
    expect(preload).toContain("'references:copy-image-id'");
    expect(main).toContain("clipboard.writeText(batchReferenceText(batch.title, batch.id))");
    expect(main).toContain("clipboard.writeText(imageIdReferenceText(id))");
  });
});

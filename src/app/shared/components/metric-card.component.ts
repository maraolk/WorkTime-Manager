import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiTitle } from '@taiga-ui/core/components/title';

@Component({
  selector: 'app-metric-card',
  imports: [TuiTitle],
  template: `
    <article class="metric-card">
      <span class="metric-label">{{ label }}</span>
      <strong tuiTitle="s">{{ value }}</strong>
      <span class="metric-note">{{ note }}</span>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = '';
  @Input() note = '';
}

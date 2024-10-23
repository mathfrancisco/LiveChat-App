import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: 'video[srcObject]'
})
export class VideoSrcObjectDirective {
  @Input()
  set srcObject(value: MediaStream | null) {
    if (value) {
      this.elementRef.nativeElement.srcObject = value;
    }
  }

  constructor(private elementRef: ElementRef) {}
}

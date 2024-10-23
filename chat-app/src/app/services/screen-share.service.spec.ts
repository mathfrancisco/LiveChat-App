import { TestBed } from '@angular/core/testing';

import { ScreenShareService } from './screen-share.service';

describe('ScreenShareService', () => {
  let service: ScreenShareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScreenShareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

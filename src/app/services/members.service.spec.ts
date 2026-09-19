import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { Member, MemberInput, MembersService } from './members.service';

describe('MembersService', () => {
  let service: MembersService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/members`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MembersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los socios', () => {
    const mockMembers: Member[] = [
      {
        id: '1',
        name: 'Juan Perez',
        phone: '11111111',
        membershipFee: 5000,
        discountPercent: 10,
        monthsOwed: 0,
        isBlocked: false,
      },
    ];

    service.getMembers().subscribe((members) => {
      expect(members).toEqual(mockMembers);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mockMembers);
  });

  it('da de alta un socio (camino feliz)', () => {
    const input: MemberInput = {
      name: 'Ana Gomez',
      phone: '22222222',
      membershipFee: 6000,
      discountPercent: 0,
    };
    const created: Member = {
      id: '2',
      ...input,
      monthsOwed: 0,
      isBlocked: false,
    };

    service.createMember(input).subscribe((member) => {
      expect(member).toEqual(created);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created, { status: 201, statusText: 'Created' });
  });

  it('propaga el error de validacion al dar de alta un socio', () => {
    const input: MemberInput = {
      name: '',
      phone: '',
      membershipFee: -1,
      discountPercent: 0,
    };
    const errorBody = { error: 'El nombre es obligatorio' };

    service.createMember(input).subscribe({
      next: () => fail('no deberia resolver con exito'),
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.error).toEqual(errorBody);
      },
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush(errorBody, { status: 400, statusText: 'Bad Request' });
  });
});

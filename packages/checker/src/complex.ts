/** Minimal complex arithmetic for numeric-sampling equivalence (docs/SPEC.md §9.1). */
export class Complex {
  constructor(
    readonly re: number,
    readonly im = 0,
  ) {}

  static readonly ZERO = new Complex(0, 0);
  static readonly ONE = new Complex(1, 0);
  static readonly I = new Complex(0, 1);

  static of(x: number | Complex): Complex {
    return typeof x === "number" ? new Complex(x, 0) : x;
  }
  static polar(r: number, theta: number): Complex {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }

  get isFinite(): boolean {
    return Number.isFinite(this.re) && Number.isFinite(this.im);
  }
  isReal(eps = 1e-12): boolean {
    return Math.abs(this.im) <= eps * Math.max(1, Math.abs(this.re));
  }
  abs(): number {
    return Math.hypot(this.re, this.im);
  }
  arg(): number {
    return Math.atan2(this.im, this.re);
  }

  add(o: Complex): Complex {
    return new Complex(this.re + o.re, this.im + o.im);
  }
  sub(o: Complex): Complex {
    return new Complex(this.re - o.re, this.im - o.im);
  }
  neg(): Complex {
    return new Complex(-this.re, -this.im);
  }
  mul(o: Complex): Complex {
    return new Complex(this.re * o.re - this.im * o.im, this.re * o.im + this.im * o.re);
  }
  div(o: Complex): Complex {
    const d = o.re * o.re + o.im * o.im;
    if (d === 0) return new Complex(NaN, NaN);
    return new Complex((this.re * o.re + this.im * o.im) / d, (this.im * o.re - this.re * o.im) / d);
  }
  conj(): Complex {
    return new Complex(this.re, -this.im);
  }

  exp(): Complex {
    return Complex.polar(Math.exp(this.re), this.im);
  }
  /** Principal natural logarithm. */
  ln(): Complex {
    return new Complex(Math.log(this.abs()), this.arg());
  }
  /** Principal square root. */
  sqrt(): Complex {
    if (this.im === 0 && this.re >= 0) return new Complex(Math.sqrt(this.re));
    const r = this.abs();
    const re = Math.sqrt((r + this.re) / 2);
    const im = Math.sign(this.im || 1) * Math.sqrt((r - this.re) / 2);
    return new Complex(re, im);
  }
  pow(o: Complex): Complex {
    // Exact-ish real cases first (integer powers, non-negative bases).
    if (o.im === 0 && this.im === 0) {
      if (Number.isInteger(o.re) || this.re >= 0) return new Complex(Math.pow(this.re, o.re));
    }
    if (o.im === 0 && Number.isInteger(o.re) && Math.abs(o.re) <= 64) {
      let result = Complex.ONE;
      let base = o.re < 0 ? Complex.ONE.div(this) : this;
      for (let n = Math.abs(o.re); n > 0; n--) result = result.mul(base);
      return result;
    }
    if (this.re === 0 && this.im === 0) return o.re > 0 ? Complex.ZERO : new Complex(NaN, NaN);
    return o.mul(this.ln()).exp();
  }
  /** Real nth root for real bases with odd n (so ∛−8 = −2); principal root otherwise. */
  root(n: number): Complex {
    if (this.im === 0 && this.re < 0 && Number.isInteger(n) && n % 2 === 1) return new Complex(-Math.pow(-this.re, 1 / n));
    return this.pow(new Complex(1 / n));
  }

  sin(): Complex {
    return new Complex(Math.sin(this.re) * Math.cosh(this.im), Math.cos(this.re) * Math.sinh(this.im));
  }
  cos(): Complex {
    return new Complex(Math.cos(this.re) * Math.cosh(this.im), -Math.sin(this.re) * Math.sinh(this.im));
  }
  tan(): Complex {
    return this.sin().div(this.cos());
  }
}

/** Relative closeness: |a − b| ≤ tol · max(1, |a|, |b|). */
export function close(a: Complex, b: Complex, tol: number): boolean {
  return a.sub(b).abs() <= tol * Math.max(1, a.abs(), b.abs());
}

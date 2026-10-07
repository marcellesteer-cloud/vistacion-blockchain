const { expect } = require("chai");
const { grossAmountForNet } = require("../scripts/transfer-fees");

describe("treasury funding amount calculation", function () {
  it("grosses up funding targets to cover the configured transfer burn", function () {
    const target = 1_000_000n * 10n ** 18n;
    const gross = grossAmountForNet(target, 50n);
    const received = gross - gross * 50n / 10_000n;

    expect(received).to.be.at.least(target);
    expect(grossAmountForNet(target, 0n)).to.equal(target);
    for (const basisPoints of [1n, 50n, 500n, 9_999n]) {
      const grossAmount = grossAmountForNet(target, basisPoints);
      expect(grossAmount - grossAmount * basisPoints / 10_000n).to.be.at.least(target);
    }
  });

  it("rejects a transfer burn that leaves no tokens to fund the contracts", function () {
    expect(() => grossAmountForNet(1n, 10_000n))
      .to.throw("burn rate below 10000 basis points");
  });
});

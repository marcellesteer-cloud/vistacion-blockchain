function grossAmountForNet(netAmount, burnBasisPoints) {
  if (netAmount < 0n || burnBasisPoints < 0n || burnBasisPoints >= 10_000n) {
    throw new Error("Net amount must be nonnegative and burn rate below 10000 basis points");
  }

  const divisor = 10_000n - burnBasisPoints;
  return (netAmount * 10_000n + divisor - 1n) / divisor;
}

module.exports = { grossAmountForNet };

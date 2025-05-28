const std = @import("std");
var prng = std.Random.DefaultPrng.init(42);
const rand = prng.random();

pub export fn poisson(lambda: f64) u32 {
    const L: f64 = @exp(-lambda);
    var k: u32 = 0;
    var p: f64 = 1.0;
    while (p > L) : (k += 1) {
        p *= std.Random.float(rand, f64);
    }
    return k - 1;
}

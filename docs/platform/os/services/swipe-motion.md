# Swipe motion profiles

`__SIM_INPUT__.swipe(start, end, options)` accepts `profile: 'linear'` (default)
or `'decelerate'`. `__SIM_INPUT__.swipeProfiles` advertises the supported values.
Coordinates, `ms`, `steps`, and inertia options retain their existing roles.
The default duration is 300ms for linear and 600ms for decelerate in the JS API;
the Python SWIPE action keeps its historical 400ms linear default and uses
600ms for decelerate. Explicit durations always win.

Decelerate cruises during the first 40% of the duration, then slows continuously
to the endpoint. Progress is `5t/3` for `t <= 0.4`, then
`1 - ((1-t)/0.6)^3/3`. This matches Aiden's HID trajectory: velocity is continuous
at the join, and velocity and acceleration approach zero at release. Samples
are scheduled at intervals of at most 16ms for decelerate when the browser can
keep up. Late frames skip stale deadlines. The final sample is followed by
immediate release, with no appended hold. Absolute scroll targets preserve
subpixel movement through the slow tail.

Both profiles estimate release velocity from the last 100ms of actual motion
samples, interpolating the window boundary. This replaces the old whole-gesture
average speed estimate. That estimate is passed to the same Android fling
distance/duration functions; decelerate does **not** disable inertia. A very
short decelerating swipe can still fling substantially. The estimator is an
approximation, not a reproduction of Android VelocityTracker or calibrated iOS
physics.

Python passes `profile` and `steps` from SWIPE action data to the JS API. For
decelerate it requires the advertised capability and propagates failures, so an
old simulator or failed execution cannot silently use the linear mouse fallback.

ScrollLab's target/high-water scoring is unchanged. Compare equal paths and
durations, recording both position at release and position after inertia;
simulator results do not establish the corresponding behavior on a real phone.

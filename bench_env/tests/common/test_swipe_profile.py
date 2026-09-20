import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from bench_env.env.base import Action, ActionType
from bench_env.env.mobile_gym import MobileGymEnv, SwipeHandler


def test_swipe_handler_forwards_profile_and_default_duration():
    env = SimpleNamespace(_parse_point=lambda p: p, verbose=False, _swipe=AsyncMock())
    asyncio.run(SwipeHandler(env).execute(Action(ActionType.SWIPE, {
        "point1": [500, 880], "point2": [500, 180], "profile": "decelerate", "steps": 48,
    })))
    env._swipe.assert_awaited_once_with((500, 880), (500, 180), duration=600, profile="decelerate", steps=48)


@pytest.mark.parametrize("failure", [False, RuntimeError("unsupported simulator")])
def test_decelerating_swipe_never_falls_back_to_linear_mouse(failure):
    env = MobileGymEnv(url="http://localhost", verbose=False)
    evaluate = AsyncMock(side_effect=failure) if isinstance(failure, Exception) else AsyncMock(return_value=False)
    env._page = SimpleNamespace(evaluate=evaluate, mouse=SimpleNamespace(move=AsyncMock(), down=AsyncMock()))
    with pytest.raises(RuntimeError, match="refusing a linear fallback"):
        asyncio.run(env._swipe((100, 200), (100, 100), profile="decelerate"))
    env.page.mouse.move.assert_not_called()
    env.page.mouse.down.assert_not_called()


def test_swipe_transmits_profile_steps_and_css_coordinates():
    env = MobileGymEnv(url="http://localhost", verbose=False)
    env._page = SimpleNamespace(evaluate=AsyncMock(return_value=True))
    asyncio.run(env._swipe((100, 200), (100, 100), 700, profile="decelerate", steps=48))
    arguments = env.page.evaluate.call_args.args[1]
    assert arguments == {"sx": 100/env.dpr, "sy": 200/env.dpr, "ex": 100/env.dpr,
                         "ey": 100/env.dpr, "d": 700, "profile": "decelerate", "steps": 48}

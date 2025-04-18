#!/usr/bin/env python3

"""Passenger model."""

# pylint: disable=C0103,R0801,R0902,R0915,C0301,W0235


from velocitas_sdk.model import (
    DataPointFloat,
    DataPointString,
    DataPointUint8,
    Model,
)


class Passenger(Model):
    """Passenger model.

    Attributes
    ----------
    AirDistribution: actuator
        Direction of airstream

        Unit: None
        Allowed values: UP, MIDDLE, DOWN
    FanSpeed: actuator
        Fan Speed, 0 = off. 100 = max

        Value range: [0, 100]
        Unit: percent
    Temperature: actuator
        Temperature

        Unit: celsius
    """

    def __init__(self, name, parent):
        """Create a new Passenger model."""
        super().__init__(parent)
        self.name = name

        self.AirDistribution = DataPointString("AirDistribution", self)
        self.FanSpeed = DataPointUint8("FanSpeed", self)
        self.Temperature = DataPointFloat("Temperature", self)

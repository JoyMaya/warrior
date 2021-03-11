//% color="#AEDD81" weight=20 icon="\uf06c"
//% groups='[ "Actuator","Handle"]'
namespace warrior {
    const PCA9685_ADDRESS = 0x40
	const MODE1 = 0x00
    const MODE2 = 0x01
	const PRESCALE = 0xFE
	const LED0_ON_L = 0x06
	
	    export enum Servos {
        S1 = 0,
        S2 = 1,
        S3 = 2,
        S4 = 3,
        S5 = 4,
        S6 = 5,
        S7 = 6,
        S8 = 7
    }
	    export enum enMotors {
        M1 = 8,
        M2 = 10,
        M3 = 12,
        M4 = 14
    }
	    
		export enum enRocker {
        //% blockId="Nostate" block="Nostate"
        Nostate = 0,
        //% blockId="Up" block="Up"
        Up,
        //% blockId="Down" block="Down"
        Down,
        //% blockId="Left" block="Left"
        Left,
        //% blockId="Right" block="Right"
        Right,
        //% blockId="Press" block="Press"
        Press
    }
	
	    export enum enButtonState {
        //% blockId="Press" block="Press"
        Press = 0,
        //% blockId="Realse" block="Realse"
        Realse = 1
    }
    
		export enum enButton {
        
        B1 = 0,
        B2,
        B3,
        B4
    }
	
    let initialized = false	
	
	function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }


    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50);
        for (let idx = 0; idx < 16; idx++) {
            setPwm(idx, 0, 0);
        }
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }	
	
    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;
        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }
	
	//% blockId=warrior_MotorRun block="Motor|%index|speed(-255~255) %speed"
    //% weight=90
    //% speed.min=-255 speed.max=255
    //% group="Actuator" name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRun(index: enMotors, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }

        let a = index
        let b = index + 1
        
        if (a > 10)
        {
            if (speed >= 0) {
                setPwm(a, 0, speed)
                setPwm(b, 0, 0)
            } else {
                setPwm(a, 0, 0)
                setPwm(b, 0, -speed)
            }
        }
        else { 
            if (speed >= 0) {
                setPwm(b, 0, speed)
                setPwm(a, 0, 0)
            } else {
                setPwm(b, 0, 0)
                setPwm(a, 0, -speed)
            }
        }
        
    }	
	
    //% blockId=warrior_servo block="Servo|%index|degree %degree"
    //% weight=80
    //% degree.min=-45 degree.max=225
    //% group="Actuator" name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Servo270(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz: 20,000 us
        let v_us = ((degree - 90) * 20 / 3 + 1500) // 0.6 ~ 2.4 (2400-600)/270
        let value = v_us * 4096 / 20000
        setPwm(index, 0, value)
    }

	//% blockId=warrior_servo360A block="Servo360|%index|degree %degree"
    //% weight=79
    //% degree.min=-180 degree.max=180
    //% group="Actuator" name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Servo360(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz: 20,000 us
        let v_us = (50/9) * degree + 1500 // 0.5~2.5 (2500-500)/360
        let value = v_us * 4096 / 20000
        setPwm(index, 0, value)
    
}

    //% blockId=warrior_Rocker block="Rocker|value %value"
    //% weight=96
    //% blockGap=10
    //% color="#FFCC00"
    //% group="Handle" name.fieldEditor="gridpicker" name.fieldOptions.columns=6
    export function Rocker(value: enRocker): boolean {

        pins.setPull(DigitalPin.P8, PinPullMode.PullUp);
        let x = pins.analogReadPin(AnalogPin.P1);
        let y = pins.analogReadPin(AnalogPin.P2);
        let z = pins.digitalReadPin(DigitalPin.P8);
        let now_state = enRocker.Nostate;

        if (x < 200) // 上
        {

            now_state = enRocker.Up;

        }
        else if (x > 900) //下
        {

            now_state = enRocker.Down;
        }
        else  // 左右
        {
            if (y < 200) //右
            {
                now_state = enRocker.Right;
            }
            else if (y > 900) //左
            {
                now_state = enRocker.Left;
            }
        }
        if (z == 0)
            now_state = enRocker.Press;
        if (now_state == value)
            return true;
        else
            return false;

    }
    
    //% blockId=warrior_Button block="Button|num %num|value %value"
    //% weight=95
    //% blockGap=10
    //% color="#FFCC00"
    //% group="Handle" name.fieldEditor="gridpicker" name.fieldOptions.columns=5
    export function Button(num: enButton, value: enButtonState): boolean {
         let temp = false;
         switch (num) {
            case enButton.B1: {
              pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
              if (pins.digitalReadPin(DigitalPin.P13) == value) {
                temp = true;
              }
              else {
                temp = false;
              }
              break;
            }
            case enButton.B2: {
              pins.setPull(DigitalPin.P14, PinPullMode.PullUp);
              if (pins.digitalReadPin(DigitalPin.P14) == value) {
                temp = true;
              }
              else {
                temp = false;
              }
              break;
            }
            case enButton.B3: {
              pins.setPull(DigitalPin.P15, PinPullMode.PullUp);
              if (pins.digitalReadPin(DigitalPin.P15) == value) {
                temp = true;
              }
              else {
                temp = false;
              }
              break;
            }
            case enButton.B4: {
              pins.setPull(DigitalPin.P16, PinPullMode.PullUp);
              if (pins.digitalReadPin(DigitalPin.P16) == value) {
                temp = true;
              }
              else {
                temp = false;
              }
              break;
            }
        }
        return temp;         
    }
    
    //% blockId==onKey block="Key %pin |Press"
    //% weight=94
    //% blockGap=10
    //% color="#FFCC00"
    //% group="Handle" name.fieldEditor="gridpicker" name.fieldOptions.columns=5
    export function onKey(pin: enButton, body: Action): void {
        let Pin = 0;
        pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
        pins.setPull(DigitalPin.P14, PinPullMode.PullUp);
        pins.setPull(DigitalPin.P15, PinPullMode.PullUp);
        pins.setPull(DigitalPin.P16, PinPullMode.PullUp); 
        if (pin == enButton.B1) {
            Pin = DigitalPin.P13;
        } else if (pin == enButton.B2) {
            Pin = DigitalPin.P14;
        } else if (pin == enButton.B3) {
            Pin = DigitalPin.P15;
        } else if (pin == enButton.B4) {
            Pin = DigitalPin.P16;
        }
        pins.onPulsed(Pin, PulseValue.Low, body);
    }
	

}

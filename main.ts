//% color="#AEDD81" weight=20 icon="\uf06c"
//% groups='[ "动力","手柄","交战","全向移动"]'
namespace 勇士 {
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
	 //全向-行驶方向速度   
		export enum enCarRun {
        //% blockId="Forward" block="Forward"
        Forward = 1,
        //% blockId="Back" block="Back"
        Back,
        //% blockId="MoveLeft" block="MoveLeft"
        MoveLeft,
        //% blockId="MoveRight" block="MoveRight"
        MoveRight,
        //% blockId="Spin_Left" block="Spin_Left"
        Spin_Left,
        //% blockId="Spin_Right" block="Spin_Right"
        Spin_Right,
        //% blockId="Left_Front" block="Left_Front"
        Left_Front,
        //% blockId="Right_Front" block="Right_Front"
        Right_Front,
        //% blockId="Left_Back" block="Left_Back"
        Left_Back,
        //% blockId="Right_Back" block="Right_Back"
        Right_Back,
        //% blockId="CarStop" block="CarStop"
        CarStop
    }
	 //全向-原地漂移 	
	    export enum enCarDrift {
        //% blockId="Head_To_Left" block="Head_To_Left"
        Head_To_Left = 1,
        //% blockId="Head_To_Right" block="Head_To_Right"
        Head_To_Right,
        //% blockId="Rear_To_Left" block="Rear_To_Left"
        Rear_To_Left,
        //% blockId="Rear_To_Right" block="Rear_To_Right"
        Rear_To_Right
    }
	 //全向-原地漂移    
	   export enum enWideAngleDrift {
        //% blockId="Left" block="Left"
        Left,
        //% blockId="Right" block="Right"
        Right
    }
	 //全向-图形	
	    export enum enPolygon {
        //% blockId="Square" block="Square"
        Square = 1,
        //% blockId="Parallelogram" block="Parallelogram"
        Parallelogram,
        //% blockId="Rhombus" block="Rhombus"
        Rhombus,
        //% blockId="Flash1" block="Flash1"
        Flash1,
        //% blockId="Flash2" block="Flash2"
        Flash2,
    }
	 //手柄-摇杆	
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
	
	//手柄-摇杆返回值
		export enum Rocker_axis {
		//% blockId="RockerX" block="RockerX"
		RockerX = 0,
		//% blockId="RockerY" block="RockerY"
		RockerY = 1
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
	//全向
	function forward(speed: number) {
        MotorRun(enMotors.M1, speed);
        MotorRun(enMotors.M2, speed);
        MotorRun(enMotors.M3, speed);
        MotorRun(enMotors.M4, speed);
    }

    function back(speed: number) {
        MotorRun(enMotors.M1, -speed);
        MotorRun(enMotors.M2, -speed);
        MotorRun(enMotors.M3, -speed);
        MotorRun(enMotors.M4, -speed);
    }

    function moveLeft(speed: number) {
        MotorRun(enMotors.M1, -speed);
        MotorRun(enMotors.M2, speed);
        MotorRun(enMotors.M3, speed);
        MotorRun(enMotors.M4, -speed);
    }

    function moveRight(speed: number) {
        MotorRun(enMotors.M1, speed);
        MotorRun(enMotors.M2, -speed);
        MotorRun(enMotors.M3, -speed);
        MotorRun(enMotors.M4, speed);
    }

    function left_Front(speed: number) {
        MotorRun(enMotors.M1, 0);
        MotorRun(enMotors.M2, speed);
        MotorRun(enMotors.M3, speed);
        MotorRun(enMotors.M4, 0);
    }

    function left_Back(speed: number) {
        MotorRun(enMotors.M1, -speed);
        MotorRun(enMotors.M2, 0);
        MotorRun(enMotors.M3, 0);
        MotorRun(enMotors.M4, -speed);
    }

    function right_Front(speed: number) {
        MotorRun(enMotors.M1, speed);
        MotorRun(enMotors.M2, 0);
        MotorRun(enMotors.M3, 0);
        MotorRun(enMotors.M4, speed);
    }

    function right_Back(speed: number) {
        MotorRun(enMotors.M1, 0);
        MotorRun(enMotors.M2, -speed);
        MotorRun(enMotors.M3, -speed);
        MotorRun(enMotors.M4, 0);
    }

    function spin_Left(speed: number) {
        MotorRun(enMotors.M1, -speed);
        MotorRun(enMotors.M2, -speed);
        MotorRun(enMotors.M3, speed);
        MotorRun(enMotors.M4, speed);
    }

    function spin_Right(speed: number) {
        MotorRun(enMotors.M1, speed);
        MotorRun(enMotors.M2, speed);
        MotorRun(enMotors.M3, -speed);
        MotorRun(enMotors.M4, -speed);
    }

    function carStop() {
        if (!initialized) {
            initPCA9685();
        }
        setPwm(8, 0, 0);
        setPwm(9, 0, 0);
        setPwm(10, 0, 0);
        setPwm(11, 0, 0);

        setPwm(12, 0, 0);
        setPwm(13, 0, 0);
        setPwm(14, 0, 0);
        setPwm(15, 0, 0);
    }

	function MecanumRun(xSpeed: number, ySpeed: number, aSpeed: number) {
        let speedm1 = ySpeed + xSpeed - aSpeed;
        let speedm2 = ySpeed - xSpeed - aSpeed;
        let speedm3 = ySpeed - xSpeed + aSpeed;
        let speedm4 = ySpeed + xSpeed + aSpeed;

        MotorRun(enMotors.M1, speedm1);
        MotorRun(enMotors.M2, speedm2);
        MotorRun(enMotors.M3, speedm3);
        MotorRun(enMotors.M4, speedm4);
    }

	//% blockId=warrior_MotorRun block="Motor|%index|speed(-255~255) %speed"
    //% weight=90
    //% speed.min=-255 speed.max=255
    //% group="动力" name.fieldEditor="gridpicker" name.fieldOptions.columns=4
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
    //% group="动力" name.fieldEditor="gridpicker" name.fieldOptions.columns=4
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
    //% group="动力" name.fieldEditor="gridpicker" name.fieldOptions.columns=4
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
    //% weight=78
    //% blockGap=10
    //% color="#FFCC00"
    //% group="手柄" name.fieldEditor="gridpicker" name.fieldOptions.columns=6
    export function Rocker(value: enRocker): boolean {

        pins.setPull(DigitalPin.P8, PinPullMode.PullUp);
        let y = pins.analogReadPin(AnalogPin.P1);
        let x = pins.analogReadPin(AnalogPin.P2);
        let z = pins.digitalReadPin(DigitalPin.P8);
        let now_state = enRocker.Nostate;

        if (y > 700) // 上
        {

            now_state = enRocker.Up;

        }
        else if (y < 300) //下
        {

            now_state = enRocker.Down;
        }
        else  // 左右
        {
            if (x > 700) //右
            {
                now_state = enRocker.Right;
            }
            else if (x < 300) //左
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
    
	//% blockId==warrior_RockerV block="RockerAxis %axis"
    //% weight=74
    //% blockGap=10
    //% color="#FFCC00"
    //% group="手柄" name.fieldEditor="gridpicker" name.fieldOptions.columns=5
    export function RockerV(axis: Rocker_axis): number {
        let RockerValue = 0;
        if (axis == Rocker_axis.RockerX) {
            RockerValue = pins.analogReadPin(AnalogPin.P2) + 40 - 512;
        } else if (axis == Rocker_axis.RockerY) {
            RockerValue = pins.analogReadPin(AnalogPin.P1) + 55 - 512;
        }
        return RockerValue; 
    }
	
    //% blockId=warrior_Button block="Button|num %num|value %value"
    //% weight=76
    //% blockGap=10
    //% color="#FFCC00"
    //% group="手柄" name.fieldEditor="gridpicker" name.fieldOptions.columns=5
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
    //% weight=75
    //% blockGap=10
    //% color="#FFCC00"
    //% group="手柄" name.fieldEditor="gridpicker" name.fieldOptions.columns=5
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
	
    //% blockId==warrior_fire block="武器发射|通道 %pin"
    //% weight=60
    //% blockGap=10
    //% color="#CC0033"
    //% group="交战" name.fieldEditor="gridpicker" name.fieldOptions.columns=5
	export function warrior_fire(pin: DigitalPin): void {
        pins.setPull(pin, PinPullMode.PullNone);
        pins.digitalWritePin(pin, 0);
        basic.pause(1000);
        pins.digitalWritePin(pin, 1);

    }
	//全向
	//% blockId=warrior_CarRun block="CarRun|%direction|speed %speed"
    //% weight=50
    //% blockGap=10
	//% color="#33CCFF"
    //% group="全向移动"
    //% speed.min=0 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function CarRun(direction: enCarRun, speed: number): void {
        if (!initialized) {
            initPCA9685();
        }
        if (speed <= 0) {
            speed = 0;
        }
        switch (direction) {
            case enCarRun.Forward:
                forward(speed);
                break;
            case enCarRun.Back:
                back(speed);
                break;
            case enCarRun.MoveLeft:
                moveLeft(speed);
                break;
            case enCarRun.MoveRight:
                moveRight(speed);
                break;
            case enCarRun.Spin_Left:
                spin_Left(speed);
                break;
            case enCarRun.Spin_Right:
                spin_Right(speed);
                break;
            case enCarRun.Left_Front:
                left_Front(speed);
                break;
            case enCarRun.Left_Back:
                left_Back(speed);
                break;
            case enCarRun.Right_Front:
                right_Front(speed);
                break;
            case enCarRun.Right_Back:
                right_Back(speed);
                break;
            case enCarRun.CarStop:
                carStop();
                break;
            default:
                break;
        }
    }
	
	//% blockId=warrior_CarDrift block="CarDrift|%direction|speed %speed"
    //% weight=49
    //% blockGap=10
	//% color="#33CCFF"
    //% group="全向移动"
    //% speed.min=0 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function CarDrift(direction: enCarDrift, speed: number): void {
        if (!initialized) {
            initPCA9685();
        }
        if (speed <= 0) {
            speed = 0;
        }
        switch (direction) {
            case enCarDrift.Rear_To_Left:
                MotorRun(enMotors.M1, 0);
                MotorRun(enMotors.M2, speed);
                MotorRun(enMotors.M3, 0);
                MotorRun(enMotors.M4, -speed);
                break;
            case enCarDrift.Rear_To_Right:
                MotorRun(enMotors.M1, 0);
                MotorRun(enMotors.M2, -speed);
                MotorRun(enMotors.M3, 0);
                MotorRun(enMotors.M4, speed);
                break;
            case enCarDrift.Head_To_Left:
                MotorRun(enMotors.M1, -speed);
                MotorRun(enMotors.M2, 0);
                MotorRun(enMotors.M3, speed);
                MotorRun(enMotors.M4, 0);
                break;
            case enCarDrift.Head_To_Right:
                MotorRun(enMotors.M1, speed);
                MotorRun(enMotors.M2, 0);
                MotorRun(enMotors.M3, -speed);
                MotorRun(enMotors.M4, 0);
                break;
            default:
                break;
        }
    }

    //% blockId=warrior_WideAngleDrift block="WideAngleDrift|%direction|speed_front %speed_front|speed_back %speed_back"
    //% weight=48
    //% blockGap=10
	//% color="#33CCFF"
    //% group="全向移动"
    //% speed_front.min=0 speed_front.max=255 
    //% speed_back.min=0 speed_back.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function WideAngleDrift(direction: enWideAngleDrift, speed_front: number, speed_back: number): void {
        if (!initialized) {
            initPCA9685();
        }
        if (speed_front <= 0) {
            speed_front = 0;
        }
        if (speed_back <= 0) {
            speed_back = 0;
        }

        switch (direction) {
            case enWideAngleDrift.Left:
                MotorRun(enMotors.M1, -speed_front);
                MotorRun(enMotors.M2, speed_back);
                MotorRun(enMotors.M3, speed_front);
                MotorRun(enMotors.M4, -speed_back);
                break;
            case enWideAngleDrift.Right:
                MotorRun(enMotors.M1, speed_front);
                MotorRun(enMotors.M2, -speed_back);
                MotorRun(enMotors.M3, -speed_front);
                MotorRun(enMotors.M4, speed_back);
                break;
            default:
                break;
        }
    }
	
	//% blockId=warrior_Polygon block="Polygon|%polygon|speed %speed"
    //% weight=47
    //% blockGap=10
	//% color="#33CCFF"
    //% group="全向移动"
    //% speed.min=0 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Polygon(polygon: enPolygon, speed: number): void {
        if (!initialized) {
            initPCA9685();
        }
        if (speed < 0) {
            speed = 0;
        }

        switch (polygon) {
            case enPolygon.Square:
                back(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                moveRight(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                forward(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                moveLeft(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);
                break;
            case enPolygon.Parallelogram:
                right_Front(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                moveRight(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                left_Back(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                moveLeft(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);
                break;
            case enPolygon.Rhombus:
                right_Front(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                right_Back(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                left_Back(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                left_Front(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);
                break;
            case enPolygon.Flash1:
                right_Front(speed);
                basic.pause(1500);
                carStop();
                basic.pause(10);

                moveLeft(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                right_Front(speed);
                basic.pause(1500);
                carStop();
                basic.pause(10);
                break;
            case enPolygon.Flash2:
                left_Back(speed);
                basic.pause(1500);
                carStop();
                basic.pause(10);

                moveRight(speed);
                basic.pause(1000);
                carStop();
                basic.pause(10);

                left_Back(speed);
                basic.pause(1500);
                carStop();
                basic.pause(10);
                break;
            default:
                break;
        }
    }
	
	//% blockId=warrior_Handle block="Handle|x %x|y %y|rotation %leftOrRight"
    //% weight=46
    //% blockGap=10
	//% color="#33CCFF"	
    //% group="全向移动"
    //% leftOrRight.min=-1 leftOrRight.max=1
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Handle(x: number, y: number, leftOrRight: number): void {
        if (!initialized) {
            initPCA9685();
        }
        if (Math.abs(x) <= 50 && Math.abs(y) <= 50) {
            x = 0;
            y = 0;
        }
        if (leftOrRight != 0 && leftOrRight != 1 && leftOrRight != -1) {
            leftOrRight = 0;
        }
        let linearSpeed = 255;
        let angularSpeed = 255;
        x = x / 512;
        y = y / 512;
        MecanumRun(x * linearSpeed, y * linearSpeed, -leftOrRight * angularSpeed);
    }
 

}

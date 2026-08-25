import Poco from "commodetto/Poco";
import Battery from "embedded:sensor/Battery";

const render = new Poco(screen);


// ============================================================
// FONTS
// ============================================================

const timeFont = new render.Font("Leco-Regular", 42);
const dateFont = new render.Font("Gothic-Regular", 14);


// ============================================================
// COLORS
// ============================================================

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const green = render.makeColor(0, 170, 0);
const yellow = render.makeColor(255, 170, 0);
const red = render.makeColor(255, 0, 0);


// ============================================================
// TEXT
// ============================================================

const DAYS = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
];

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


// ============================================================
// BATTERY
// ============================================================

let batteryPercent = 100;

const battery = new Battery({});


// ============================================================
// ANIMATION GRAPHICS
// ============================================================

let adjust = 0;


// ============================================================
// BITMAPS
// ============================================================

/*
1  = waternight.png
2  = fish0.png       ← Gary frame 1
3  = fish1.png       ← Gary frame 2
4  = fish2.png       ← Gary frame 3
5  = dolphin1.png
6  = dolphin2.png
7  = pet1.png
8  = pet2.png
9  = pet3.png
10 = pet4.png
11 = pet5.png
12 = pet6.png
13 = whale.png   ← Gary frame 5
14 = fish3.png  ← Gary frame 4
*/


// ============================================================
// GARY FRAMES
// ============================================================

const garyFrames = [
    new Poco.PebbleBitmap(2),
    new Poco.PebbleBitmap(3),
    new Poco.PebbleBitmap(4)
];

let gary = garyFrames[0];


// ============================================================
// PET FRAMES
// ============================================================

const petFrames = [
    new Poco.PebbleBitmap(5),
    new Poco.PebbleBitmap(6),
    new Poco.PebbleBitmap(7),
    new Poco.PebbleBitmap(8),
    new Poco.PebbleBitmap(9),
    new Poco.PebbleBitmap(10),
    new Poco.PebbleBitmap(11),
    new Poco.PebbleBitmap(12)
];


// ============================================================
// OCEAN
// ============================================================

const ocean = new Poco.PebbleBitmap(1);


// ============================================================
// POSITIONS
// ============================================================

// Gary starts at the bottom-right
let garyX = render.width;

let garyY =
    render.height;


// Pet starts at the bottom
let petX = (render.width-50);

let petY =
    render.height;


// ============================================================
// PET ANIMATION
// ============================================================

// Current two frames selected by the minute

let petFrame = petFrames[0];
let petFrame2 = petFrames[1];

let animationCounter = 0;


// ============================================================
// MAIN DRAW FUNCTION
// ============================================================

function draw(event) {

    // ========================================================
    // GET CURRENT TIME
    // ========================================================

    const now = event?.date ?? new Date();


    // ========================================================
    // GET CURRENT MINUTE
    // ========================================================

    const minute = now.getMinutes();


    // ========================================================
    // SELECT GARY FRAME
    // ========================================================

    const garyIndex = minute % 3;

    gary = garyFrames[garyIndex];


    // ========================================================
    // SELECT PET FRAMES
    // ========================================================

    /*
     * Pet has 8 frames.
     *
     * minute 0 → frames 0 + 1
     * minute 1 → frames 2 + 3
     * minute 2 → frames 4 + 5
     * minute 3 → frames 6 + 7
     * minute 4 → back to frames 0 + 1
     *
     * The % 4 loops through all 4 pairs.
     */

    const pair = minute % 4;

    const petIndex = pair * 2;

    petFrame = petFrames[petIndex];
    petFrame2 = petFrames[petIndex + 1];


    // ========================================================
    // GET BATTERY PERCENTAGE
    // ========================================================

    batteryPercent =
        battery.sample().percent;


    render.begin();


    // ========================================================
    // BACKGROUND
    // ========================================================

    render.fillRectangle(
        black,
        0,
        0,
        render.width,
        render.height
    );


    // ========================================================
    // OCEAN
    // ========================================================

    if (render.width > 200) {
        adjust = 30;
    }

    render.drawBitmap(
        ocean,
        -30 + adjust,
        render.height - ocean.height
    );


    // ========================================================
    // PET
    // ========================================================

    /*
     * Alternate between the two selected pet frames.
     *
     * animationCounter changes every 50ms.
     * 0/1 gives approximately 100ms per frame.
     */

    const currentPet =
        animationCounter % 2 === 0
            ? petFrame
            : petFrame2;

    render.drawBitmap(
        currentPet,
        petX,
        petY
    );





    // ========================================================
    // BATTERY
    // ========================================================

    drawBatteryBar();


    // ========================================================
    // TIME
    // ========================================================

    const hours =
         String(now.getHours() % 12 || 12).padStart(2, "0");

    const minutes =
        String(now.getMinutes()).padStart(2, "0");


    // --------------------------------------------------------
    // Hours
    // --------------------------------------------------------

    const timeX = (render.width / 9) +(adjust/2);
    const timeY = render.height / 6 +(adjust/2);

    render.drawText(
        hours,
        timeFont,
        white,
        timeX,
        timeY
    );


    // --------------------------------------------------------
    // Minutes
    // --------------------------------------------------------
    // Same horizontal position as the hours,
    // directly underneath.

    render.drawText(
        minutes,
        timeFont,
        white,
        timeX,
        timeY + timeFont.height
    );


    // ========================================================
    // DATE
    // ========================================================

    const dayName =
        DAYS[now.getDay()];

    const monthName =
        MONTHS[now.getMonth()];


    const dateStr =
        `${dayName} ${monthName} ${String(now.getDate()).padStart(2, "0")}`;


    let width =
        render.getTextWidth(
            dateStr,
            dateFont
        );


    render.drawText(
        dateStr,
        dateFont,
        white,
        timeX,
        timeFont.height * 2 + 40+(adjust/2)
    );


    // ========================================================
    // GARY
    // ========================================================

    render.drawBitmap(
        gary,
        garyX,
        garyY
    );

    // ========================================================
    // MOON
    // ========================================================

    const moon =
        getMoonPhase(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );


    drawMoon(moon);


    render.end();
}


// ============================================================
// BATTERY BAR
// ============================================================

function drawBatteryBar() {

    const barWidth =
        (render.width / 8) | 0;


    // Center the battery bar

    const barX =
        (((render.width - barWidth) / 2) - 20) | 0;


    const barY = render.height-20;

    const barHeight = 8;


    // --------------------------------------------------------
    // Border
    // --------------------------------------------------------

    render.fillRectangle(
        white,
        barX,
        barY,
        barWidth,
        barHeight
    );


    // --------------------------------------------------------
    // Interior
    // --------------------------------------------------------

    render.fillRectangle(
        black,
        barX + 1,
        barY + 1,
        barWidth - 2,
        barHeight - 2
    );


    // --------------------------------------------------------
    // Battery color
    // --------------------------------------------------------

    let barColor;


    if (batteryPercent <= 20) {

        barColor = red;

    }

    else if (batteryPercent <= 40) {

        barColor = yellow;

    }

    else {

        barColor = green;

    }


    // --------------------------------------------------------
    // Filled portion
    // --------------------------------------------------------

    const fillWidth =
        ((batteryPercent * (barWidth - 4)) / 100) | 0;


    render.fillRectangle(
        barColor,
        barX + 2,
        barY + 2,
        fillWidth,
        barHeight - 4
    );
}


// ============================================================
// MOON
// ============================================================

function drawMoon(Moon) {

    const CX =
        ((render.width * 3 / 4) - 30) | 0;

    const CY = render.height -15;

    const moon = Moon;


    // --------------------------------------------------------
    // New moon
    // --------------------------------------------------------

    if (moon == 0) {

        render.drawCircle(
            white,
            CX,
            CY,
            6,
            0,
            360
        );


        render.drawCircle(
            black,
            CX,
            CY,
            5,
            0,
            360
        );
    }


    // --------------------------------------------------------
    // Full moon
    // --------------------------------------------------------

    else if (moon == 4) {

        render.drawCircle(
            white,
            CX,
            CY,
            8,
            0,
            360
        );
    }


    // --------------------------------------------------------
    // Waxing half
    // --------------------------------------------------------

    else if (moon == 2) {

        render.drawCircle(
            white,
            CX,
            CY,
            7,
            0,
            360
        );


        render.drawCircle(
            black,
            CX,
            CY,
            6,
            180,
            360
        );
    }


    // --------------------------------------------------------
    // Waning half
    // --------------------------------------------------------

    else if (moon == 6) {

        render.drawCircle(
            white,
            CX,
            CY,
            7,
            0,
            360
        );


        render.drawCircle(
            black,
            CX,
            CY,
            6,
            0,
            180
        );
    }


    // --------------------------------------------------------
    // Waxing crescent
    // --------------------------------------------------------

    else if (moon == 7) {

        render.drawCircle(
            white,
            CX,
            CY,
            7,
            0,
            360
        );


        render.drawCircle(
            black,
            CX + 3,
            CY,
            6,
            0,
            360
        );
    }


    // --------------------------------------------------------
    // Waning crescent
    // --------------------------------------------------------

    else if (moon == 1) {

        render.drawCircle(
            white,
            CX,
            CY,
            7,
            0,
            360
        );


        render.drawCircle(
            black,
            CX - 3,
            CY,
            6,
            0,
            360
        );
    }


    // --------------------------------------------------------
    // Moon phase 5
    // --------------------------------------------------------

    else if (moon == 5) {

        render.drawCircle(
            white,
            CX,
            CY,
            7,
            0,
            360
        );


        render.drawCircle(
            black,
            CX + 4,
            CY,
            6,
            0,
            180
        );
    }


    // --------------------------------------------------------
    // Moon phase 3
    // --------------------------------------------------------

    else if (moon == 3) {

        render.drawCircle(
            white,
            CX,
            CY,
            7,
            0,
            360
        );


        render.drawCircle(
            black,
            CX - 4,
            CY,
            6,
            180,
            360
        );
    }
}


// ============================================================
// MOON PHASE CALCULATION
// ============================================================

function getMoonPhase(year, month, day) {

    let c = 0;
    let e = 0;
    let jd = 0;
    let b = 0;


    if (month < 3) {

        year--;

        month += 12;
    }


    month++;


    c = 365.25 * year;

    e = 30.6 * month;


    jd =
        c + e + day - 694039.09;


    jd /= 29.5305882;


    b = Math.floor(jd);


    jd -= b;


    b =
        Math.round(jd * 8);


    if (b >= 8) {
        b = 0;
    }


    return b;
}


// ============================================================
// ANIMATION LOOP
// ============================================================
//
// 50ms = approximately 20 frames per second.
// The pet switches between its two selected frames
// every 100ms.
//

setInterval(() => {


    // --------------------------------------------------------
    // Move Gary DIAGONALLY
    // Bottom-right → Top-left
    // --------------------------------------------------------

    garyX -= 2;
    garyY -= 2;


    if (
        garyX < -gary.width ||
        garyY < -gary.height
    ) {

        garyX = render.width;
        garyY = render.height;

    }


    // --------------------------------------------------------
    // Move Pet UP
    // Bottom → Top
    // --------------------------------------------------------

    petY -= 2;


    if (petY < -petFrame.height) {

        petY = render.height;

    }


    // --------------------------------------------------------
    // Pet animation
    // --------------------------------------------------------

    animationCounter++;


    // --------------------------------------------------------
    // Draw everything
    // --------------------------------------------------------

    draw({
        date: new Date()
    });


}, 50);


// ============================================================
// WATCHFACE TIME UPDATE
// ============================================================

watch.addEventListener(
    "minutechange",
    draw
);

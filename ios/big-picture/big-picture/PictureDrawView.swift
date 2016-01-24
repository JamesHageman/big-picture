//
//  PictureDrawView.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-22.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit
import CoreGraphics

class PictureDrawView: UIView {

    let clearColorIntValue : Int = -1
    var colorList : [UIColor]!
    var currentColorInt : Int!
    var pictureSideLength : Int = 32 //in "pixels"
    var divisionSideLength : CGFloat! // in actual pixels
    var pictureStateStack : [[[Int]]]! =  [[[Int]]]()//this is a stack of 2d arrays, each filled with ints corresponding to pixel colours
                                        //pictureStateStack[stackLevel][y][x]
    var shouldDrawGrid : Bool = false
    var strokeWidth = 0
    
    func initializeValues(colors: [UIColor]) {
        colorList = colors
        currentColorInt = 0
        divisionSideLength = self.superview!.frame.size.width / CGFloat(pictureSideLength)
        appendNewStack()
    }
    
    func pixelCoordinateFromTouchLocation(touchLocation: CGPoint) -> (x : Int, y : Int) {
        return (x: (Int)(touchLocation.x / self.frame.size.width * CGFloat(pictureSideLength)),
                       y: (Int)(touchLocation.y / self.frame.size.height * CGFloat(pictureSideLength)))
    }
    
    func appendNewStack() {
        if (pictureStateStack.count == 0) {
            pictureStateStack.append(
                [[Int]](count: pictureSideLength, repeatedValue:
                    [Int](count: pictureSideLength, repeatedValue: clearColorIntValue)
                ))
        }
        else {
            pictureStateStack.append(pictureStateStack.last!)
        }
        if (pictureStateStack.count > 20) {
            pictureStateStack.removeFirst()
        }
    }
    
    func popStack() {
        pictureStateStack.popLast()
        self.setNeedsDisplay()
    }
    
    func toggleGrid() {
        shouldDrawGrid = !shouldDrawGrid
        self.setNeedsDisplay()
    }
    
    func addTouchLocationToStacks(touchLocation : CGPoint) { //should never be called on empty stacks
        let pixelCoord : (x : Int, y : Int)! = pixelCoordinateFromTouchLocation(touchLocation)
        if (pixelCoord.x >= pictureSideLength || pixelCoord.y >= pictureSideLength) {
            return;
        }
        
    //    let xScreenVal = CGFloat(pixelCoord.x) * divisionSideLength, yScreenVal = CGFloat(pixelCoord.y) * divisionSideLength
       // if (pictureStateStack[pictureStateStack.count-1][pixelCoord.y][pixelCoord.x] != currentColorInt) {
        
        for var i = pixelCoord.x - strokeWidth; i <= pixelCoord.x + strokeWidth; i++ {
            for var j = pixelCoord.y - strokeWidth; j <= pixelCoord.y + strokeWidth; j++ {
                if (i >= 0 && i < pictureSideLength && j >= 0 && j < pictureSideLength) {
                    if ((i - pixelCoord.x) * (i - pixelCoord.x) + (j - pixelCoord.y) * (j - pixelCoord.y)
                        <= strokeWidth * strokeWidth) {
                        pictureStateStack[pictureStateStack.count-1][j][i] = currentColorInt
                    }
                }
            }
        }
            self.setNeedsDisplay()
    }
    
    func pixelArrayHasEmptySpots() -> Bool {
        if let pArray = pictureStateStack.last {
            for var i = 0; i < pictureSideLength; i++ {
                for var j = 0; j < pictureSideLength; j++ {
                    if (pArray[j][i] == clearColorIntValue) {
                        return true
                    }
                }
            }
            return false
        }
        return true
    }
    
    func fillFromPoint(point: (x: Int, y: Int), var target: Int, newValue: Int) {
        if (target == -2) {
            target = pictureStateStack.last![point.y][point.x]
        }
        if (target == newValue) {
            return
        }
        if (point.x >= 0 && point.x < pictureSideLength && point.y >= 0 && point.y < pictureSideLength) {
            if (pictureStateStack.last![point.y][point.x] == target) {
                pictureStateStack[pictureStateStack.count-1][point.y][point.x] = newValue
                fillFromPoint((x: point.x - 1, y: point.y), target: target, newValue: newValue)
                fillFromPoint((x: point.x + 1, y: point.y), target: target, newValue: newValue)
                fillFromPoint((x: point.x, y: point.y - 1), target: target, newValue: newValue)
                fillFromPoint((x: point.x, y: point.y + 1), target: target, newValue: newValue)
            }
        }
        setNeedsDisplay()
    }
    
    func fillEmptyPixels() {
        for var i = 0; i < pictureSideLength; i++ {
            for var j = 0; j < pictureSideLength; j++ {
                if (pictureStateStack[pictureStateStack.count - 1][j][i] == clearColorIntValue) {
                    if (j == 0) {
                        pictureStateStack[pictureStateStack.count - 1][j][i] = pictureStateStack[pictureStateStack.count - 1][j+1][i]
                    }
                    else if (j == pictureSideLength-1) {
                        pictureStateStack[pictureStateStack.count - 1][j][i] = pictureStateStack[pictureStateStack.count - 1][j-1][i]
                    }
                    else {
                        pictureStateStack[pictureStateStack.count - 1][j][i] =
                            max(pictureStateStack[pictureStateStack.count - 1][j+1][i], pictureStateStack[pictureStateStack.count - 1][j-1][i])
                    }
                }
            }
        }
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        appendNewStack()
        if (strokeWidth == -1) {
            fillFromPoint(pixelCoordinateFromTouchLocation(touches.first!.locationInView(self)), target: -2, newValue: currentColorInt)
        }
        else {
            addTouchLocationToStacks(touches.first!.locationInView(self))
        }
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {
       // print(touches.first!.locationInView(self))
        if (strokeWidth != -1) {
            addTouchLocationToStacks(touches.first!.locationInView(self))
        }
    }

    override func drawRect(rect: CGRect) {
        if let cont = UIGraphicsGetCurrentContext(), currentPicture = pictureStateStack.last {
     //       let rectSideLength = (rect.width > divisionSideLength * 2) ? divisionSideLength : rect.width
            let xSpan = (min: (Int)(rect.origin.x / divisionSideLength),
                         max: (Int)(rect.origin.x / divisionSideLength + rect.width / divisionSideLength))
            let ySpan = (min: (Int)(rect.origin.y / divisionSideLength),
                max: (Int)(rect.origin.y / divisionSideLength + rect.height / divisionSideLength))
            for var i = xSpan.min; i < xSpan.max; i++ {
                if (shouldDrawGrid) {
                    CGContextSetRGBStrokeColor(cont, 100.0/255.0, 100.0/255.0, 100.0/255.0, 0.5)
                    CGContextMoveToPoint(cont, 0, CGFloat(i) * divisionSideLength)
                    CGContextAddLineToPoint(cont, self.frame.width, CGFloat(i) * divisionSideLength)
                    CGContextMoveToPoint(cont, CGFloat(i) * divisionSideLength, 0)
                    CGContextAddLineToPoint(cont, CGFloat(i) * divisionSideLength, self.frame.height)
                    CGContextStrokePath(cont)
                }
                for var j = ySpan.min; j < ySpan.max; j++ {
                    let colorIndex = currentPicture[j][i]
                    if (colorIndex != clearColorIntValue) {
                        CGContextSetFillColorWithColor(cont, colorList[colorIndex].CGColor)
                        CGContextAddRect(cont, CGRectMake(CGFloat(i) * divisionSideLength, CGFloat(j) * divisionSideLength, divisionSideLength+1, divisionSideLength+1))
                        CGContextFillPath(cont)
                    }
                }
            }
        }
    }


}

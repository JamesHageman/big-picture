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
    var currentColorInt : Int! {
        didSet {
            if let path = pathStack.last {
                path.currentColorIndex = currentColorInt
            }
        }
    }
    var pictureSideLength : Int = 32 //in "pixels"
    var divisionSideLength : CGFloat! // in actual pixels
    var pictureStateStack : [[[Int]]]! =  [[[Int]]]()//this is a stack of 2d arrays, each filled with ints corresponding to pixel colours
                                        //pictureStateStack[stackLevel][y][x]
    var pathStack : [ColoredPath]! = [ColoredPath]()
    
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
            pathStack.append(ColoredPath(colors: colorList))
        }
        else {
            pictureStateStack.append(pictureStateStack.last!)
            pathStack.append(pathStack.last!.pathCopy())
        }
    }
    
    func popStack() {
        pictureStateStack.popLast()
        pathStack.popLast()
    }
    
    func addTouchLocationToStacks(touchLocation : CGPoint) { //should never be called on empty stacks
        let pixelCoord : (x : Int, y : Int)! = pixelCoordinateFromTouchLocation(touchLocation)
        let xScreenVal = CGFloat(pixelCoord.x) * divisionSideLength, yScreenVal = CGFloat(pixelCoord.y) * divisionSideLength
        if (pictureStateStack[pictureStateStack.count-1][pixelCoord.y][pixelCoord.x] != currentColorInt) {
            pictureStateStack[pictureStateStack.count-1][pixelCoord.y][pixelCoord.x] = currentColorInt
            CGPathMoveToPoint(pathStack.last!.getCurrentPath(), nil, xScreenVal, yScreenVal)
            CGPathAddRect(pathStack.last!.getCurrentPath(), nil, CGRectMake(xScreenVal, yScreenVal, divisionSideLength, divisionSideLength))
            CGPathCloseSubpath(pathStack.last!.getCurrentPath())
            self.setNeedsDisplay()
        }
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        appendNewStack()
        addTouchLocationToStacks(touches.first!.locationInView(self))
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {
        addTouchLocationToStacks(touches.first!.locationInView(self))
    }

    override func drawRect(rect: CGRect) {
        if let context = UIGraphicsGetCurrentContext(), currentPath = pathStack.last {
            currentPath.drawPathsWithContext(context)
        }
    }


}

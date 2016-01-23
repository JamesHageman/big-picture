//
//  PictureDrawView.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-22.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class PictureDrawView: UIView {

    let clearColorIntValue : Int = 0
    var currentColor : UIColor!
    var pictureSideLength : Int = 64 //in "pixels"
    var pictureStateStack : [[[Int]]]! //this is a stack of 2d arrays, each filled with ints corresponding to pixel colours
                                        //pictureStateStack[stackLevel][x][y]
    
    func pixelCoordinateFromTouchLocation(touchLocation: CGPoint) -> CGPoint{
        
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        pictureStateStack.append(
            [[Int]](count: pictureSideLength, repeatedValue:
                [Int](count: pictureSideLength, repeatedValue: 0)
            ))
        
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {
        pictureStateStack.append(
            [[Int]](count: pictureSideLength, repeatedValue:
                [Int](count: pictureSideLength, repeatedValue: 0)
            ))
    }
    
    /*
    // Only override drawRect: if you perform custom drawing.
    // An empty implementation adversely affects performance during animation.
    override func drawRect(rect: CGRect) {
        // Drawing code
    }
    */

}

//
//  ColorButton.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class ColorButton: UIButton {
    
    var color : UIColor = UIColor(red: 0, green: 0, blue: 0, alpha: 1)
    var shouldAppearDarkened : Bool?/*{
        didSet {
            dispatch_async(dispatch_get_main_queue()) { () -> Void in
                self.setNeedsDisplay()
            }
        }
    }*/
    let darkMask : UIColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.3)
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    override func drawRect(rect: CGRect) {
        let cont = UIGraphicsGetCurrentContext()
        CGContextAddEllipseInRect(cont, CGRectMake(2, 2, self.bounds.width - 4, self.bounds.height - 4))
        CGContextSetFillColorWithColor(cont, color.CGColor)
        if (shouldAppearDarkened != nil && shouldAppearDarkened! == true) {
            CGContextSetStrokeColorWithColor(cont, UIColor.blueColor().CGColor)
        }
        else {
            CGContextSetStrokeColorWithColor(cont, UIColor.blackColor().CGColor)
        }
        CGContextDrawPath(cont, CGPathDrawingMode.EOFillStroke)
        
      /*  if (shouldAppearDarkened != nil && shouldAppearDarkened! == true) {
            CGContextAddEllipseInRect(cont, CGRectMake(2, 2, self.bounds.width - 4, self.bounds.height - 4))
            CGContextSetFillColorWithColor(cont, darkMask.CGColor)
            CGContextFillPath(cont)
        }*/
    }
}

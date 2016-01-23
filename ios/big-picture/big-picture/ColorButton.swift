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
    let darkMask : UIColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.3)
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    override func drawRect(rect: CGRect) {
        let cont = UIGraphicsGetCurrentContext()
        CGContextAddEllipseInRect(cont, self.bounds)
        CGContextSetFillColorWithColor(cont, color.CGColor)
        CGContextFillPath(cont)
        
        if (self.state == UIControlState.Highlighted) {
            CGContextAddEllipseInRect(cont, self.bounds)
            CGContextSetFillColorWithColor(cont, darkMask.CGColor)
            CGContextFillPath(cont)
        }
    }
}

//
//  ColoredPath.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-22.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import Foundation
import UIKit
import CoreGraphics

class ColoredPath : AnyObject {
    
    var pathColors : [UIColor] = [UIColor]()
    var paths : [CGMutablePathRef] = [CGMutablePathRef]()
    var currentColorIndex : Int = 0
    var path : CGMutablePathRef = CGPathCreateMutable()
    
    init(colors: [UIColor]) {
        pathColors = colors
        for _ in 1...pathColors.count {
            paths.append(CGPathCreateMutable())
        }
    }
    
    func getCurrentPath() -> CGMutablePathRef {
        return paths[currentColorIndex]
    }
    
    func pathCopy() -> ColoredPath {
        let ret = ColoredPath(colors: pathColors)
        ret.currentColorIndex = currentColorIndex
        for index in 0...pathColors.count-1 {
            ret.paths[index] = CGPathCreateMutableCopy(paths[index])!
        }
        return ret
    }
    
    func drawPathsWithContext(cont: CGContextRef) {
        for index in 0...pathColors.count-1 {
            CGContextSetFillColorWithColor(cont, pathColors[index].CGColor)
            CGContextAddPath(cont, paths[index])
          //  CGContextSetRGBFillColor(cont, 1, 0, 0, 1)
            CGContextFillPath(cont)
        }
    }
    
}

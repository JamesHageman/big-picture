//
//  ImageProgressView.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class ImageProgressView: UIView {
    var colorList : [UIColor]!
    var pictureSideLength : Int = 32 //in "pixels"
    var divisionSideLength : CGFloat! // in actual pixels
    var pixelArray : [[Int]]!
    var imageDimension : CGSize!
    var imageRowsColumns : CGSize!
    var pixelSize : CGFloat!
    
    func setValues(colors: [UIColor], dimension: CGSize, rowsCols: CGSize, pArray: [[Int]]) {
        colorList = colors
        imageDimension = dimension
        imageRowsColumns = rowsCols
        pixelArray = pArray
        pixelSize = self.bounds.width / dimension.width
    }
    
    override func drawRect(rect: CGRect) {
        let cont = UIGraphicsGetCurrentContext()
        let hgt = (Int)(imageDimension.height), wid = (Int)(imageDimension.width)
        for var i = 0; i < hgt; i++ {
            for var j = 0; j < wid; j++ {
                if (pixelArray[i][j] >= 0) {
                    CGContextSetFillColorWithColor(cont, colorList[pixelArray[i][j]].CGColor)
                    CGContextAddRect(cont, CGRectMake(CGFloat(j) * pixelSize, CGFloat(i) * pixelSize, pixelSize+1, pixelSize+1))
                    CGContextFillPath(cont)
                }
            }
        }
    }
    
}

//
//  CompletedWorkCollectionViewCell.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-24.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class CompletedWorkCollectionViewCell: UICollectionViewCell {
    @IBOutlet var thumbnailView : UIImageView!
    @IBOutlet var titleLabel : UILabel!
    var fillColor : UIColor!, strokeColor : UIColor!
    var imageID : String!
    
    func setupCell(pic: Picture, title: String) {
        titleLabel.text = title
        imageID = pic.imageID
        /*fillColor = pic.colors[0]
        if (pic.colors.count > 1) {
            strokeColor = pic.colors[1]
        }
        else {
            strokeColor = UIColor.blackColor()
        }*/
        fillColor = UIColor(red: 34/255.0, green: 135/255.0, blue: 84/255.0, alpha: 0.6)
        strokeColor = UIColor.blackColor()
        if let img = pic.image {
            thumbnailView.image = img
        }
        else {
            pic.imageLoadedCallback = { (img: UIImage) -> Void in
                dispatch_async(dispatch_get_main_queue(), { () -> Void in
                    self.thumbnailView.image = img
                })
            }
        }
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        fillColor = UIColor(red: 18/255.0, green: 72/255.0, blue: 45/255.0, alpha: 0.8)
        setNeedsDisplay()
        nextResponder()?.touchesBegan(touches, withEvent: event)
    }
    
    override func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?) {
        fillColor = UIColor(red: 34/255.0, green: 135/255.0, blue: 84/255.0, alpha: 0.6)
        setNeedsDisplay()
        nextResponder()?.touchesEnded(touches, withEvent: event)
    }
    
    override func drawRect(rect: CGRect) {
      /*  let cont = UIGraphicsGetCurrentContext()
        CGContextAddRect(cont, self.bounds)
        CGContextSetFillColorWithColor(cont, fillColor.CGColor)
        CGContextSetStrokeColorWithColor(cont, strokeColor.CGColor)
        CGContextSetLineJoin(cont, CGLineJoin.Round)
        CGContextSetLineWidth(cont, 2)
        CGContextDrawPath(cont, CGPathDrawingMode.EOFillStroke)*/
        let bPath = UIBezierPath(roundedRect: CGRectMake(2, 2, self.bounds.width - 4, self.bounds.height - 4), cornerRadius: 10)
        bPath.lineWidth = 3
        bPath.lineJoinStyle = CGLineJoin.Round
        strokeColor.setStroke()
        fillColor.setFill()
        bPath.fill()
      //  bPath.stroke()
    }
    
}

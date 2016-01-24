//
//  WorkInProgressTableViewCell.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class WorkInProgressTableViewCell: UITableViewCell {
    
    var imageID : String!
    private var _progress : CGFloat!
    var progress : CGFloat! {
        get {
            return _progress
        }
        set(newProgress) {
            if (progress >= 0.0 && progress <= 1.0) {
                _progress = newProgress
                //self.setNeedsDisplay()
            }
        }
    }
    var colors : [CGColor]!
    var gestureTarget : MainMenuViewController!
    var initialTouchXVal : CGFloat?, deltaX : CGFloat = 0
    var touchHasMoved : Bool = false
    @IBOutlet var titleLabel : UILabel!
    
    func setupCell(colorsP: [UIColor], gestureTargetP: MainMenuViewController, imageIDP: String, title: String) {
        colors = [CGColor]()
        for color in colorsP {
            colors.append(CGColorCreateCopyWithAlpha(color.CGColor, 0.4)!)
        }
        gestureTarget = gestureTargetP
        imageID = imageIDP
        _progress = 0
     //   let swipe = UISwipeGestureRecognizer(target: self, action: "viewWorkInProgress")
     //   swipe.direction = UISwipeGestureRecognizerDirection.Left
     //   self.addGestureRecognizer(swipe)
     //   let tap = UITapGestureRecognizer(target: self, action: "contributeToWorkInProgress")
     //   self.addGestureRecognizer(tap)
        self.titleLabel.text = title
    }
    
    func viewWorkInProgress() {
        gestureTarget.goToViewWorkInProgressWithImageID(imageID)
    }
    
    func contributeToWorkInProgress() {
        gestureTarget.goToContributeToWorkInProgressWithImageID(imageID)
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        if let touch = touches.first {
            initialTouchXVal = touch.locationInView(self).x
        }
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {
        if let touch = touches.first {
            deltaX = max(initialTouchXVal! - touch.locationInView(self).x, 0)
            if (deltaX > 0) {
                self.setNeedsDisplay()
            }
            touchHasMoved = true
        }
    }

    override func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?) {
        if (deltaX / self.frame.width > 0.3) {
            viewWorkInProgress()
        }
        else if (!touchHasMoved) {
            contributeToWorkInProgress()
        }
        deltaX = 0
        touchHasMoved = false
        NSTimer.scheduledTimerWithTimeInterval(NSTimeInterval(0.6), target: self, selector: "animateStripes:", userInfo: nil, repeats: true)
    }
    
    func animateStripes(timer: NSTimer) {
        deltaX -= 2
        if (deltaX <= 0) {
            deltaX = 0
            timer.invalidate()
        }
        dispatch_async(dispatch_get_main_queue()) { () -> Void in
            self.setNeedsDisplay()
        }
    }
    
    
    override func drawRect(rect: CGRect) {
        print(deltaX)
        let cont = UIGraphicsGetCurrentContext()
        CGContextAddRect(cont, self.bounds)
        CGContextSetFillColorWithColor(cont, colors[0])
        CGContextFillPath(cont)
        CGContextTranslateCTM(cont, deltaX * -1, 0)
        for var i = 1; i < colors.count; i++ {
            let stripeWidth = self.bounds.width / CGFloat(colors.count)
            CGContextMoveToPoint(cont, stripeWidth * CGFloat(i-1), self.bounds.height)
            CGContextAddLineToPoint(cont, stripeWidth * CGFloat(i), 0)
            CGContextAddLineToPoint(cont, stripeWidth * CGFloat(i+1), 0)
            CGContextAddLineToPoint(cont, stripeWidth * CGFloat(i), self.bounds.height)
            CGContextClosePath(cont)
            CGContextSetFillColorWithColor(cont, colors[i])
            CGContextFillPath(cont)
           // break;
        }
        CGContextAddRect(cont, CGRectMake(self.bounds.width * (1 - self.progress), 0, self.bounds.width * self.progress, self.bounds.height))
        CGContextSetRGBFillColor(cont, 0.9, 0.9, 0.9, 0.4)
        CGContextFillPath(cont)
    }
    
}

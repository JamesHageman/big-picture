//
//  ViewController.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-22.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class ViewController: UIViewController {

    @IBOutlet var backDropImageView : UIImageView!
    @IBOutlet var pictureDrawView : PictureDrawView! //always set the pictureSideLength property of pictureDrawView before
                                                     //allowing the user to do anything
    @IBOutlet var colorButtons : [ColorButton]!
    var availableColours : [UIColor]! = [UIColor](arrayLiteral: UIColor(red: 1, green: 0, blue: 0, alpha: 1), UIColor(red: 0.0, green: 0.0, blue: 1, alpha: 1), UIColor(red: 0, green: 1, blue: 0, alpha: 1))
    
    override func viewDidLoad() {
        super.viewDidLoad()
        let numColors = availableColours.count
        for index in 0...7 {
            if (index >= numColors) {
                colorButtons[index].hidden = true
            }
            else {
                self.view.addConstraint(NSLayoutConstraint(item: colorButtons[index], attribute: NSLayoutAttribute.CenterX, relatedBy: NSLayoutRelation.Equal, toItem: self.view, attribute: NSLayoutAttribute.Left, multiplier: 1.0, constant: self.view.frame.size.width / CGFloat(numColors + 1) * CGFloat(index+1)))
                colorButtons[index].color = availableColours[index]
            }
            self.view.addConstraint(NSLayoutConstraint(item: colorButtons[index], attribute: NSLayoutAttribute.Width, relatedBy: NSLayoutRelation.Equal, toItem: self.view, attribute: NSLayoutAttribute.Width, multiplier: 0.08, constant: 0))
            self.view.addConstraint(NSLayoutConstraint(item: colorButtons[index], attribute: NSLayoutAttribute.Height, relatedBy: NSLayoutRelation.Equal, toItem: colorButtons[index], attribute: NSLayoutAttribute.Width, multiplier: 1, constant: 0))
        }
        pictureDrawView.initializeValues(availableColours)
        // Do any additional setup after loading the view, typically from a nib.
    }
    
    @IBAction func changeSelectedColor(sender: UIButton) {
        pictureDrawView.currentColorInt = sender.tag
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    
    override func prefersStatusBarHidden() -> Bool {
        return true
    }

}


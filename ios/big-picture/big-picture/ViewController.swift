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
    
    var availableColours : [UIColor]!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}


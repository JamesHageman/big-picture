//
//  MainMenuViewController.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class MainMenuViewController: UIViewController {
    
    var socketDelegate : SocketDelegate!
    
    override func viewDidLoad() {
        socketDelegate = SocketDelegate(url: SocketDelegate.urlBase)
    }
    
    @IBAction func beginPictureDrawing() {
        socketDelegate.askForImage { (picture) -> Void in
            self.performSegueWithIdentifier("showPictureVCSegue", sender: picture)
        }
    }
    
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if let picture = sender as? Picture, vc = segue.destinationViewController as? PictureDrawViewController {
            vc.setPicture(picture, sDelegate: self.socketDelegate)
        }
    }
}

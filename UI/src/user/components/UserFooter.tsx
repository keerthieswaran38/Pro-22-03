import React from 'react';
import { Link } from 'react-router-dom';

export default function UserFooter() {
    return (
        <footer id="contact" className="footer-full">
            <div className="footer-top">
                <div className="footer-col footer-about">
                    <div className="footer-brand">GAGNER<span className="green">SPORTS</span></div>
                    <p>GAGNER BUSINESS SOLUTION is aimed at inculcating the value of sport in kids and adults. We offer the Best-in-Class Sports program for kids and adults. We help you find the hidden skill and employ techniques to develop fine and gross motor skills.</p>
                </div>
                <div className="footer-col">
                    <h4>QUICK LINKS</h4>
                    <ul>
                        <li><a href="#" className="hover-target">Home</a></li>
                        <li><a href="#about" className="hover-target">About Us</a></li>
                        <li><a href="#services" className="hover-target">Services</a></li>
                        <li><a href="#events" className="hover-target">Events</a></li>
                        <li><a href="#contact" className="hover-target">Contact Us</a></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>POLICIES</h4>
                    <ul>
                        <li><a href="https://gagnersports.com/privacy-policy/" target="_blank" className="hover-target">Privacy Policy</a></li>
                        <li><a href="https://gagnersports.com/terms-conditions/" target="_blank" className="hover-target">Terms & Conditions</a></li>
                        <li><a href="https://gagnersports.com/refund-cancellation-policy/" target="_blank" className="hover-target">Refund & Cancellation</a></li>
                    </ul>
                </div>
                <div className="footer-col footer-contact-info">
                    <h4>CONTACT US</h4>
                    <div className="contact-detail">
                        <span>Plot No: 17/18 S.No.485 Jayapriya Nagar, Kolapakkam, Chennai-600128</span>
                    </div>
                    <div className="contact-detail">
                        <span>+91 98405 47782<br />+91 96001 93310</span>
                    </div>
                    <div className="contact-detail">
                        <span>balaji@gagnersports.com</span>
                    </div>
                </div>
            </div>
            <div className="footer-bottom-bar">
                <p>© 2022 - 2026 All Rights Reserved <strong>GAGNER SPORTS</strong> & ENTERTAINMENT PVT LTD</p>
            </div>
        </footer>
    );
}
